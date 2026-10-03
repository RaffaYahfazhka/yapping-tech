import { NextResponse } from 'next/server';

export async function GET(request) {
  const domain = process.env.JIRA_DOMAIN || 'etbteam.atlassian.net';
  const email = process.env.JIRA_EMAIL || 'raffa.yahfazhka@etb.co.id';
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!apiToken) {
    return NextResponse.json({ error: 'JIRA_API_TOKEN belum diset di .env.local' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectKey = searchParams.get('project');
  const onlyMe = searchParams.get('onlyMe') !== 'false'; // default true: filter tickets assigned to user

  const authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;

  // JQL query: prioritize tickets assigned to currentUser()
  let jql = '';
  if (onlyMe) {
    if (projectKey && projectKey !== 'all') {
      jql = `project = "${projectKey}" AND assignee = currentUser() ORDER BY updated DESC`;
    } else {
      jql = `assignee = currentUser() ORDER BY updated DESC`;
    }
  } else {
    if (projectKey && projectKey !== 'all') {
      jql = `project = "${projectKey}" ORDER BY updated DESC`;
    } else {
      jql = `updated >= -180d ORDER BY updated DESC`;
    }
  }

  try {
    const res = await fetch(`https://${domain}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: ['summary', 'description', 'issuetype', 'priority', 'status', 'project', 'assignee'],
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: 'Jira API Error', details: errText }, { status: res.status });
    }

    const data = await res.json();

    // Helper extracting plain text from Jira Atlassian Document Format (ADF)
    const extractText = (node) => {
      if (!node) return '';
      if (typeof node === 'string') return node;
      if (node.text) return node.text;
      if (Array.isArray(node.content)) {
        return node.content.map(extractText).join(' ');
      }
      return '';
    };

    // Helper recursively searching for Figma design URLs inside ADF description
    const extractFigmaUrl = (node) => {
      if (!node) return null;
      if (typeof node === 'object') {
        const url = node?.attrs?.url;
        if (typeof url === 'string' && url.includes('figma.com')) return url;
        if (typeof node.text === 'string' && node.text.includes('figma.com')) {
          const match = node.text.match(/https:\/\/[^\s"']+/);
          if (match && match[0].includes('figma.com')) return match[0];
        }
        for (const key of Object.keys(node)) {
          const found = extractFigmaUrl(node[key]);
          if (found) return found;
        }
      } else if (Array.isArray(node)) {
        for (const item of node) {
          const found = extractFigmaUrl(item);
          if (found) return found;
        }
      }
      return null;
    };

    const tickets = (data.issues || []).map((issue) => {
      const typeName = issue.fields.issuetype?.name || 'Story';
      const isBug = typeName.toLowerCase().includes('bug');
      const isFE = (issue.fields.summary || '').toLowerCase().includes('fe') || typeName.toLowerCase().includes('ui') || typeName.toLowerCase().includes('styling');
      const coder = isFE ? 'bimo' : isBug ? 'bimo' : 'kian';

      let desc = extractText(issue.fields.description);
      const figmaUrl = extractFigmaUrl(issue.fields.description);

      if (!desc || desc.trim().length === 0) {
        desc = `Tiket Jira aktif dari project ${issue.fields.project?.name} (${issue.fields.project?.key}).`;
      }

      // Extract custom AC items if present in description or fallback
      let acItems = [];
      if (desc.includes('Acceptance Criteria')) {
        const acSection = desc.split(/Acceptance Criteria[:\s]*/i)[1] || '';
        const rawLines = acSection.split(/Figma[:\s]*|Pain Points[:\s]*|Objective[:\s]*/i)[0];
        const lines = rawLines.split(/\n|\.\s+/).map((l) => l.trim()).filter((l) => l.length > 5);
        if (lines.length > 0) acItems = lines.slice(0, 4);
      }
      if (acItems.length === 0) {
        acItems = [
          `Implementasi fitur/fix sesuai summary: "${issue.fields.summary}"`,
          'Unit & integration tests passing di CI pipeline',
          'Code review lolos linting & pixel/schema check',
        ];
      }

      return {
        key: issue.key,
        summary: issue.fields.summary || 'Untitled issue',
        type: ['Story', 'Bug', 'Task'].includes(typeName) ? typeName : 'Task',
        priority: issue.fields.priority?.name || 'Medium',
        status: issue.fields.status?.name || 'To Do',
        description: desc.slice(0, 400),
        projectName: issue.fields.project?.name || 'General',
        projectKey: issue.fields.project?.key || 'JIRA',
        repo: 'frontend-dashboard-v2', // mapped default
        points: isBug ? 2 : 5,
        coder,
        figmaUrl: figmaUrl || null,
        ac: acItems,
        plan: [
          'Arga: Scan codebase & susun dependency graph',
          `${coder === 'bimo' ? 'Bimo' : 'Kian'}: Implementasi kode & schema`,
          'Vani: Run test suite & static code analysis',
        ],
        files: [
          {
            path: `src/features/${issue.key.toLowerCase()}.ts`,
            status: 'modified',
            diff: `@@ -1,5 +1,12 @@\n+// Implemented for Jira ticket ${issue.key}: ${issue.fields.summary}\n+export async function handle${issue.key.replace('-', '')}() {\n+  return { success: true, timestamp: Date.now() };\n+}`,
          },
        ],
        tests: [
          `${issue.key} › validasi business logic`,
          `${issue.key} › error boundaries & null handling`,
          `${issue.key} › e2e acceptance criteria pass`,
        ],
      };
    });

    return NextResponse.json({
      success: true,
      total: data.total || tickets.length,
      tickets,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
