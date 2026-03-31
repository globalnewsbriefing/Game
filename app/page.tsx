import { getPolymarketWorkspace, type CapabilitySection, type PromptRecipe } from "@/lib/polymarket";

export const dynamic = "force-dynamic";

function formatGeneratedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function CommandCard({ section }: { section: CapabilitySection }) {
  return (
    <section className="capability-card">
      <div className="capability-card__header">
        <div>
          <p className="eyebrow">Capability</p>
          <h2>{section.title}</h2>
        </div>
        <span className="status-pill">{section.authLabel}</span>
      </div>
      <p className="section-copy">{section.summary}</p>
      <div className="command-list">
        {section.commands.map((command) => (
          <article key={command.id} className="command-card">
            <div className="command-card__header">
              <div>
                <h3>{command.title}</h3>
                <p>{command.summary}</p>
              </div>
              <span className={`wallet-pill${command.walletRequired ? " wallet-pill--required" : ""}`}>
                {command.walletRequired ? "Wallet required" : "Read only"}
              </span>
            </div>
            <code>{command.command}</code>
            {command.jsonCommand ? (
              <div className="json-box">
                <span>JSON mode</span>
                <code>{command.jsonCommand}</code>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function PromptCard({
  recipe,
  commandLookup,
}: {
  recipe: PromptRecipe;
  commandLookup: Map<string, string>;
}) {
  return (
    <article className="prompt-card">
      <p className="eyebrow">Prompt recipe</p>
      <h3>{recipe.title}</h3>
      <p className="section-copy">{recipe.goal}</p>
      <blockquote>{recipe.prompt}</blockquote>
      <div className="chip-row">
        {recipe.commandIds.map((id) => (
          <span key={id} className="chip">
            {commandLookup.get(id) ?? id}
          </span>
        ))}
      </div>
    </article>
  );
}

export default async function HomePage() {
  const workspace = getPolymarketWorkspace();
  const commandLookup = new Map(
    workspace.capabilitySections.flatMap((section) =>
      section.commands.map((command) => [command.id, command.title] as const),
    ),
  );

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Polymarket CLI</p>
          <h1>Leaderboard, markets, orders, positions, and onchain workflows from one terminal guide.</h1>
          <p className="hero__lede">{workspace.overview}</p>
          <div className="hero__stats">
            <div>
              <span>Command families</span>
              <strong>{workspace.stats.commandFamilies}</strong>
            </div>
            <div>
              <span>Tracked commands</span>
              <strong>{workspace.stats.trackedCommands}</strong>
            </div>
            <div>
              <span>Prompt recipes</span>
              <strong>{workspace.stats.promptRecipes}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{formatGeneratedAt(workspace.generatedAt)}</strong>
            </div>
          </div>
          <div className="hero__links">
            <a className="primary-link" href={workspace.sourceUrl} target="_blank" rel="noreferrer">
              Open upstream CLI
            </a>
            <a className="secondary-link" href="/api/polymarket" target="_blank" rel="noreferrer">
              Open JSON API
            </a>
          </div>
        </div>
        <div className="hero__panel">
          <p className="eyebrow">Source warning</p>
          <h2>Experimental software</h2>
          <p className="section-copy">{workspace.warning}</p>
          <div className="install-block">
            <h3>Quick start</h3>
            <ul>
              {workspace.quickStart.map((command) => (
                <li key={command}>
                  <code>{command}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Install and configure</p>
            <h2>Terminal-first setup</h2>
          </div>
          <p>Use Homebrew, the shell installer, or build from source; switch to wallet flows only when you need authenticated commands.</p>
        </div>
        <div className="setup-grid">
          <article className="info-card">
            <h3>Homebrew</h3>
            {workspace.install.homebrew.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </article>
          <article className="info-card">
            <h3>Shell install</h3>
            <code>{workspace.install.shellScript}</code>
          </article>
          <article className="info-card">
            <h3>Build from source</h3>
            {workspace.install.fromSource.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </article>
          <article className="info-card">
            <h3>Wallet setup</h3>
            {workspace.walletSetup.map((command) => (
              <code key={command}>{command}</code>
            ))}
          </article>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Capabilities</p>
            <h2>What you can do from the CLI</h2>
          </div>
          <p>Every section includes direct terminal commands and JSON-mode variants for scripts and agents.</p>
        </div>
        <div className="capability-grid">
          {workspace.capabilitySections.map((section) => (
            <CommandCard key={section.id} section={section} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Kalshi-style prompts</p>
            <h2>Prompt patterns for agents and scripts</h2>
          </div>
          <p>These prompts mirror the way people ask trading assistants to inspect leaderboards, browse markets, place orders, and manage risk.</p>
        </div>
        <div className="prompt-grid">
          {workspace.promptRecipes.map((recipe) => (
            <PromptCard key={recipe.id} recipe={recipe} commandLookup={commandLookup} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Automation workflows</p>
            <h2>Human table output or machine JSON</h2>
          </div>
          <p>Start in the terminal, then flip to JSON output when you want a script or agent to continue the flow.</p>
        </div>
        <div className="workflow-grid">
          {workspace.workflows.map((workflow) => (
            <article key={workflow.id} className="workflow-card">
              <h3>{workflow.title}</h3>
              <p className="section-copy">{workflow.summary}</p>
              <div className="workflow-steps">
                {workflow.commands.map((command) => (
                  <code key={command}>{command}</code>
                ))}
              </div>
            </article>
          ))}
          <article className="workflow-card">
            <h3>JSON examples</h3>
            <p className="section-copy">Direct machine-readable snippets for downstream automation.</p>
            <div className="workflow-steps">
              {workspace.apiExamples.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
