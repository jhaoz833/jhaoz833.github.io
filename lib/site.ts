// 站点级配置（公开值）
export const REPO_ID = "R_kgDOUI6Wew"; // jhaoz833.github.io 的节点 ID

// 社区动态分类（讨论帖），由岛主在仓库 Discussions 里创建后填入
export const COMMUNITY_CATEGORY_ID: string = "DIC_kwDOUI6We84DElgC";
export const communityReady = () => COMMUNITY_CATEGORY_ID !== "PENDING";
