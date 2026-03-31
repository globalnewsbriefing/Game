export type CommandExample = {
  id: string;
  title: string;
  summary: string;
  command: string;
  jsonCommand?: string;
  walletRequired: boolean;
};

export type CapabilitySection = {
  id: string;
  title: string;
  summary: string;
  authLabel: string;
  commands: CommandExample[];
};

export type PromptRecipe = {
  id: string;
  title: string;
  prompt: string;
  goal: string;
  commandIds: string[];
};

export type Workflow = {
  id: string;
  title: string;
  summary: string;
  commands: string[];
};

export type PolymarketWorkspace = {
  generatedAt: string;
  title: string;
  sourceUrl: string;
  warning: string;
  overview: string;
  install: {
    homebrew: string[];
    shellScript: string;
    fromSource: string[];
  };
  quickStart: string[];
  walletSetup: string[];
  apiExamples: string[];
  capabilitySections: CapabilitySection[];
  promptRecipes: PromptRecipe[];
  workflows: Workflow[];
  stats: {
    commandFamilies: number;
    trackedCommands: number;
    promptRecipes: number;
    walletRequiredFamilies: number;
  };
};

const capabilitySections: CapabilitySection[] = [
  {
    id: "leaderboard-data",
    title: "Leaderboard and public data",
    summary:
      "Pull live leaderboards, wallet activity, positions, and market-level metrics without configuring a wallet.",
    authLabel: "Public data only",
    commands: [
      {
        id: "leaderboard-month-pnl",
        title: "Monthly PnL leaderboard",
        summary: "See the top wallets on Polymarket ranked by profit and loss for the month.",
        command: "polymarket data leaderboard --period month --order-by pnl --limit 10",
        jsonCommand:
          "polymarket -o json data leaderboard --period month --order-by pnl --limit 10",
        walletRequired: false,
      },
      {
        id: "builder-week",
        title: "Weekly builder leaderboard",
        summary: "Inspect builder rankings for the current week.",
        command: "polymarket data builder-leaderboard --period week",
        jsonCommand: "polymarket -o json data builder-leaderboard --period week",
        walletRequired: false,
      },
      {
        id: "wallet-positions",
        title: "Wallet positions",
        summary: "Read a wallet's current conditional token holdings.",
        command: "polymarket data positions 0xWALLET_ADDRESS",
        jsonCommand: "polymarket -o json data positions 0xWALLET_ADDRESS",
        walletRequired: false,
      },
      {
        id: "open-interest",
        title: "Market open interest",
        summary: "Inspect open interest for a specific condition ID.",
        command: "polymarket data open-interest 0xCONDITION_ID",
        jsonCommand: "polymarket -o json data open-interest 0xCONDITION_ID",
        walletRequired: false,
      },
    ],
  },
  {
    id: "browse-markets",
    title: "Browse markets and events",
    summary:
      "Search markets, list events by tag, and drill into a single market or event exactly like a research terminal.",
    authLabel: "No wallet needed",
    commands: [
      {
        id: "markets-list",
        title: "List active markets",
        summary: "List active markets ordered by liquidity or volume.",
        command: "polymarket markets list --active true --order volume_num --limit 10",
        jsonCommand:
          "polymarket -o json markets list --active true --order volume_num --limit 10",
        walletRequired: false,
      },
      {
        id: "markets-search",
        title: "Search markets",
        summary: "Search for markets by keyword, such as election or bitcoin.",
        command: 'polymarket markets search "bitcoin" --limit 5',
        jsonCommand: 'polymarket -o json markets search "bitcoin" --limit 5',
        walletRequired: false,
      },
      {
        id: "events-tag",
        title: "Browse events by tag",
        summary: "Show active politics events to mirror a Kalshi-style topic scan.",
        command: "polymarket events list --tag politics --active true --limit 10",
        jsonCommand:
          "polymarket -o json events list --tag politics --active true --limit 10",
        walletRequired: false,
      },
      {
        id: "market-get",
        title: "Get one market",
        summary: "Fetch a market by slug or ID to review the exact contract.",
        command: "polymarket markets get will-trump-win-the-2024-election",
        jsonCommand:
          "polymarket -o json markets get will-trump-win-the-2024-election",
        walletRequired: false,
      },
    ],
  },
  {
    id: "research-prices",
    title: "Research prices and order books",
    summary:
      "Inspect order books, midpoint prices, spreads, and price history before placing a trade.",
    authLabel: "No wallet needed",
    commands: [
      {
        id: "clob-book",
        title: "Inspect order book",
        summary: "Read the live CLOB book for a token ID.",
        command: "polymarket clob book TOKEN_ID",
        jsonCommand: "polymarket -o json clob book TOKEN_ID",
        walletRequired: false,
      },
      {
        id: "clob-midpoint",
        title: "Check midpoint",
        summary: "Get a clean programmatic midpoint price for scripts and agents.",
        command: "polymarket clob midpoint TOKEN_ID",
        jsonCommand: "polymarket -o json clob midpoint TOKEN_ID",
        walletRequired: false,
      },
      {
        id: "clob-price-history",
        title: "Price history",
        summary: "Review historical pricing before entering a position.",
        command: "polymarket clob price-history TOKEN_ID --interval 1d --fidelity 30",
        jsonCommand:
          "polymarket -o json clob price-history TOKEN_ID --interval 1d --fidelity 30",
        walletRequired: false,
      },
      {
        id: "clob-market",
        title: "Condition-level market metadata",
        summary: "Fetch market metadata by condition ID.",
        command: "polymarket clob market 0xCONDITION_ID",
        jsonCommand: "polymarket -o json clob market 0xCONDITION_ID",
        walletRequired: false,
      },
    ],
  },
  {
    id: "orders-trading",
    title: "Place and manage orders",
    summary:
      "Create limit or market orders, inspect open orders, and cancel by order, market, or account.",
    authLabel: "Configured wallet required",
    commands: [
      {
        id: "wallet-create",
        title: "Create wallet",
        summary: "Generate a Polymarket wallet and save it to the CLI config.",
        command: "polymarket wallet create",
        walletRequired: false,
      },
      {
        id: "approve-set",
        title: "Approve contracts",
        summary: "Grant ERC-20 and ERC-1155 approvals before trading.",
        command: "polymarket approve set",
        walletRequired: true,
      },
      {
        id: "limit-order",
        title: "Create limit order",
        summary: "Place a buy order for shares at a target price.",
        command: "polymarket clob create-order --token TOKEN_ID --side buy --price 0.45 --size 20",
        jsonCommand:
          "polymarket -o json clob create-order --token TOKEN_ID --side buy --price 0.45 --size 20",
        walletRequired: true,
      },
      {
        id: "market-order",
        title: "Create market order",
        summary: "Spend a fixed amount of collateral at market.",
        command: "polymarket clob market-order --token TOKEN_ID --side buy --amount 5",
        jsonCommand:
          "polymarket -o json clob market-order --token TOKEN_ID --side buy --amount 5",
        walletRequired: true,
      },
      {
        id: "cancel-all",
        title: "Cancel orders",
        summary: "Cancel all working orders when you need to reset risk quickly.",
        command: "polymarket clob cancel-all",
        jsonCommand: "polymarket -o json clob cancel-all",
        walletRequired: true,
      },
    ],
  },
  {
    id: "positions-portfolio",
    title: "Manage positions and balances",
    summary:
      "Track collateral, conditional balances, trades, and portfolio value from the CLI or JSON output.",
    authLabel: "Wallet for private account state",
    commands: [
      {
        id: "clob-balance",
        title: "Collateral balance",
        summary: "Check wallet collateral before placing orders.",
        command: "polymarket clob balance --asset-type collateral",
        jsonCommand: "polymarket -o json clob balance --asset-type collateral",
        walletRequired: true,
      },
      {
        id: "clob-orders",
        title: "Open orders",
        summary: "List your current resting orders.",
        command: "polymarket clob orders",
        jsonCommand: "polymarket -o json clob orders",
        walletRequired: true,
      },
      {
        id: "clob-trades",
        title: "Trade history",
        summary: "Review fills and recent private trade activity.",
        command: "polymarket clob trades",
        jsonCommand: "polymarket -o json clob trades",
        walletRequired: true,
      },
      {
        id: "portfolio-value",
        title: "Portfolio value",
        summary: "Read public wallet value for agent monitoring dashboards.",
        command: "polymarket data value 0xWALLET_ADDRESS",
        jsonCommand: "polymarket -o json data value 0xWALLET_ADDRESS",
        walletRequired: false,
      },
    ],
  },
  {
    id: "contracts-onchain",
    title: "Interact with onchain contracts",
    summary:
      "Check approvals, split and merge conditional tokens, redeem winners, and bridge assets into Polygon.",
    authLabel: "Wallet and gas required for writes",
    commands: [
      {
        id: "approve-check",
        title: "Check approvals",
        summary: "Read current token approvals without sending a transaction.",
        command: "polymarket approve check",
        jsonCommand: "polymarket -o json approve check",
        walletRequired: false,
      },
      {
        id: "ctf-split",
        title: "Split USDC into outcome tokens",
        summary: "Mint YES and NO conditional tokens from collateral.",
        command: "polymarket ctf split --condition 0xCONDITION_ID --amount 10",
        jsonCommand:
          "polymarket -o json ctf split --condition 0xCONDITION_ID --amount 10",
        walletRequired: true,
      },
      {
        id: "ctf-merge",
        title: "Merge outcome tokens",
        summary: "Burn paired outcome tokens back into USDC.",
        command: "polymarket ctf merge --condition 0xCONDITION_ID --amount 10",
        jsonCommand:
          "polymarket -o json ctf merge --condition 0xCONDITION_ID --amount 10",
        walletRequired: true,
      },
      {
        id: "ctf-redeem",
        title: "Redeem winning tokens",
        summary: "Redeem resolved winning positions after market settlement.",
        command: "polymarket ctf redeem --condition 0xCONDITION_ID",
        jsonCommand: "polymarket -o json ctf redeem --condition 0xCONDITION_ID",
        walletRequired: true,
      },
      {
        id: "bridge-deposit",
        title: "Bridge deposit addresses",
        summary: "Fetch chain-specific deposit addresses for bringing assets into Polymarket.",
        command: "polymarket bridge deposit 0xWALLET_ADDRESS",
        jsonCommand: "polymarket -o json bridge deposit 0xWALLET_ADDRESS",
        walletRequired: false,
      },
    ],
  },
];

const promptRecipes: PromptRecipe[] = [
  {
    id: "prompt-leaderboard",
    title: "Leaderboard check",
    prompt:
      "Like a Kalshi leaderboard prompt, show me the Polymarket monthly leaderboard sorted by pnl and return JSON I can feed into an agent.",
    goal: "Leaderboard scan for top performers with machine-readable output.",
    commandIds: ["leaderboard-month-pnl"],
  },
  {
    id: "prompt-market-scan",
    title: "Browse politics markets",
    prompt:
      "Browse active politics markets on Polymarket, list the top events, and include JSON output for downstream filtering.",
    goal: "Research active event clusters before drilling into a market.",
    commandIds: ["events-tag", "markets-list"],
  },
  {
    id: "prompt-market-research",
    title: "Research one market",
    prompt:
      "Find a bitcoin market, open the contract, inspect the order book, and summarize price history like a trading assistant.",
    goal: "Combine discovery with order-book and history research.",
    commandIds: ["markets-search", "market-get", "clob-book", "clob-price-history"],
  },
  {
    id: "prompt-place-order",
    title: "Place a limit order",
    prompt:
      "Set up my wallet, approve contracts, and place a buy order for 20 shares at 45 cents.",
    goal: "Translate a natural-language trade request into the exact CLI sequence.",
    commandIds: ["wallet-create", "approve-set", "limit-order"],
  },
  {
    id: "prompt-manage-risk",
    title: "Manage positions",
    prompt:
      "Show my collateral, open orders, recent trades, and portfolio value so I can adjust risk from the terminal.",
    goal: "Review private and public account state in one pass.",
    commandIds: ["clob-balance", "clob-orders", "clob-trades", "portfolio-value"],
  },
  {
    id: "prompt-onchain",
    title: "Onchain contract workflow",
    prompt:
      "Check approvals, split collateral into YES and NO tokens, then merge or redeem after settlement.",
    goal: "Drive conditional-token lifecycle steps from prompts or scripts.",
    commandIds: ["approve-check", "ctf-split", "ctf-merge", "ctf-redeem"],
  },
];

const workflows: Workflow[] = [
  {
    id: "workflow-research",
    title: "Research from terminal to JSON",
    summary: "Browse a market, inspect price action, then switch into JSON mode for automation.",
    commands: [
      'polymarket markets search "bitcoin" --limit 5',
      "polymarket markets get bitcoin-above-100k",
      "polymarket clob book TOKEN_ID",
      "polymarket -o json clob midpoint TOKEN_ID",
    ],
  },
  {
    id: "workflow-trading",
    title: "Trading setup and execution",
    summary: "Generate a wallet, approve contracts, check balance, then place an order.",
    commands: [
      "polymarket wallet create",
      "polymarket approve set",
      "polymarket clob balance --asset-type collateral",
      "polymarket clob market-order --token TOKEN_ID --side buy --amount 5",
    ],
  },
  {
    id: "workflow-portfolio",
    title: "Portfolio monitoring",
    summary: "Track positions and value from either authenticated or public wallet views.",
    commands: [
      "polymarket data positions 0xYOUR_ADDRESS",
      "polymarket data value 0xYOUR_ADDRESS",
      "polymarket clob orders",
      "polymarket clob trades",
    ],
  },
];

const install = {
  homebrew: [
    "brew tap Polymarket/polymarket-cli https://github.com/Polymarket/polymarket-cli",
    "brew install polymarket",
  ],
  shellScript: "curl -sSL https://raw.githubusercontent.com/Polymarket/polymarket-cli/main/install.sh | sh",
  fromSource: [
    "git clone https://github.com/Polymarket/polymarket-cli",
    "cd polymarket-cli",
    "cargo install --path .",
  ],
};

const quickStart = [
  "polymarket markets list --limit 5",
  'polymarket markets search "election"',
  "polymarket events list --tag politics",
  "polymarket markets get will-trump-win-the-2024-election",
  "polymarket -o json markets list --limit 3",
];

const walletSetup = [
  "polymarket setup",
  "polymarket wallet create",
  "polymarket approve set",
];

const apiExamples = [
  "polymarket -o json markets list --limit 100 | jq '.[].question'",
  "polymarket -o json clob midpoint TOKEN_ID | jq '.mid'",
  "polymarket -o json data leaderboard --period month --order-by pnl --limit 10",
];

function countTrackedCommands(sections: CapabilitySection[]) {
  return sections.reduce((count, section) => count + section.commands.length, 0);
}

export function getPolymarketWorkspace(): PolymarketWorkspace {
  return {
    generatedAt: new Date().toISOString(),
    title: "Polymarket CLI workspace",
    sourceUrl: "https://github.com/Polymarket/polymarket-cli",
    warning:
      "Polymarket describes the CLI as early, experimental software. Verify transactions before signing and avoid using large amounts of funds.",
    overview:
      "This workspace translates the Polymarket CLI README into a browsable terminal guide and JSON-friendly prompt catalog. It covers the leaderboard, market discovery, order placement, position management, and onchain conditional-token workflows in a format that feels similar to Kalshi research prompts.",
    install,
    quickStart,
    walletSetup,
    apiExamples,
    capabilitySections,
    promptRecipes,
    workflows,
    stats: {
      commandFamilies: capabilitySections.length,
      trackedCommands: countTrackedCommands(capabilitySections),
      promptRecipes: promptRecipes.length,
      walletRequiredFamilies: capabilitySections.filter((section) =>
        section.commands.some((command) => command.walletRequired),
      ).length,
    },
  };
}
