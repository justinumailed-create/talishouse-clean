/** Deep-dive transcript excerpted from live talisu.com/au for print/read UX. */
export const TALISU_DEEP_DIVE_TRANSCRIPT: string[] = [
  "Imagine buying a 5% stake in a 20-acre Chaga mushroom farm while you're just sitting there waiting for your morning coffee.",
  "You aren't calling a real estate agent, you aren't sitting in some stuffy title company's office signing a mountain of paperwork.",
  "Instead, with just a few taps on your phone, that fraction of a physical farm is sitting right there in your digital wallet — generating a potential yield, fully documented, and mathematically verified.",
  "The massive catch: how do you force a 200-year-old legal property system to move at the breakneck speed of a blockchain?",
  "This deep dive unpacks a tokenization blueprint that attempts to do exactly that — the collision of physical dirt and digital data.",
  "The pipeline is a structured six-step chain of custody: physical asset → legal rights via SPV → asset NFT → fractionalization layer → user wallet → marketplace trading.",
  "An SPV (special purpose vehicle) quarantines the asset: if the original developer goes bankrupt, the SPV protects your specific asset. It is a legal firewall.",
  "Eligible assets can be divided into a predefined pool of participation units — for example 500,000 units. Acquire 25,000 and you hold a mathematically guaranteed 5% stake.",
  "Asset-specific rules mean a slice of an operating plantation may carry yield rights, while a raw lot may only confer usage or development votes.",
  "Infrastructure targets BASE with Solidity contracts. ERC-721 NFTs represent unique asset records; a separate fungible ecosystem token handles settlement, fees, and rewards — intentionally firewalled from ownership rights.",
  "Account abstraction / embedded smart wallets hide seed phrases, gas fees, and network switching so the UX feels like a standard trading app.",
  "Critical legal line: the NFT does not independently create legal title to real estate. Underlying agreements define the holder's legal and economic rights. The blockchain is a secure filing cabinet — not the judge or the county clerk.",
  "Hybrid architecture: core ledgers settle on-chain; KYC, passports, and private SPV documents stay off-chain, linked by cryptographic hashes.",
  "A 12-month roadmap covers legal-technical architecture, ERC-721 / fractionalization build, transfer engines, compliance testing, and independent smart-contract audit before production minting.",
  "Emergency pause controls, multi-sig administration, and role-based access acknowledge that pure decentralization is dangerous for physical property — governance and compliance need human oversight.",
  "The takeaway: physical yield-bearing assets can be fractionally owned through apps rather than mortgage desks — democratizing access while keeping code subservient to law.",
];
