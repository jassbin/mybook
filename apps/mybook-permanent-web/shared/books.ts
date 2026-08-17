import type { BookCatalogItem, Locale } from "./narrative";

export const bookCatalog: Record<Locale, BookCatalogItem[]> = {
  "zh-CN": [
    { id: "red", channel: "classic", color: "#bd5365", title: "红楼梦", character: "林黛玉", domain: "亲密关系", hook: "在寄人篱下的敏感里，守住自己的真心。", subtitle: "一滴泪，照见一座园", characters: ["林黛玉", "薛宝钗", "王熙凤"] },
    { id: "water", channel: "classic", color: "#3a79a8", title: "水浒传", character: "林冲", domain: "尊严与反抗", hook: "当退让被一步步逼到尽头，你还会忍吗？", subtitle: "风雪山神庙之外", characters: ["林冲", "鲁智深", "武松"] },
    { id: "journey", channel: "classic", color: "#ca8738", title: "西游记", character: "孙悟空", domain: "自由与规训", hook: "拥有通天本领后，仍要学会如何同行。", subtitle: "一根金箍的重量", characters: ["孙悟空", "唐僧", "猪八戒"] },
    { id: "camel", channel: "modern", color: "#5f9962", title: "骆驼祥子", character: "祥子", domain: "生存选择", hook: "当体面越来越贵，一个人能守住什么？", subtitle: "一辆车与一个人", characters: ["祥子", "虎妞", "小福子"] },
    { id: "call", channel: "modern", color: "#356c99", title: "呐喊", character: "闰土", domain: "失语与觉醒", hook: "被生活磨钝之后，怎样重新认出彼此？", subtitle: "故乡的月色不再相同", characters: ["闰土", "祥林嫂", "狂人"] },
    { id: "miserables", channel: "world", color: "#8b5e94", title: "悲惨世界", character: "冉阿让", domain: "宽恕与责任", hook: "一次善意，能否让人脱离过去的名字？", subtitle: "银烛台仍在发亮", characters: ["冉阿让", "芳汀", "珂赛特"] },
    { id: "pride", channel: "women", color: "#bd6d86", title: "傲慢与偏见", character: "伊丽莎白", domain: "判断与亲密", hook: "当第一印象如此笃定，你愿意承认看错了吗？", subtitle: "舞会之外的选择", characters: ["伊丽莎白", "达西", "简"] },
    { id: "little", channel: "women", color: "#4a8a7a", title: "小妇人", character: "乔", domain: "自我与家庭", hook: "野心与爱并不必然互相辜负。", subtitle: "在阁楼写下自己的名字", characters: ["乔", "艾米", "贝丝"] },
  ],
  "en-US": [
    { id: "red", channel: "classic", color: "#bd5365", title: "Dream of the Red Chamber", character: "Lin Daiyu", domain: "Intimacy", hook: "Guard your truth while living under another family’s roof.", subtitle: "One tear, one whole garden", characters: ["Lin Daiyu", "Xue Baochai", "Wang Xifeng"] },
    { id: "water", channel: "classic", color: "#3a79a8", title: "Water Margin", character: "Lin Chong", domain: "Dignity", hook: "When every retreat is taken from you, do you still endure?", subtitle: "Beyond the snowy temple", characters: ["Lin Chong", "Lu Zhishen", "Wu Song"] },
    { id: "journey", channel: "classic", color: "#ca8738", title: "Journey to the West", character: "Sun Wukong", domain: "Freedom", hook: "Even with a heaven-shaking gift, can you learn to travel with others?", subtitle: "The weight of a golden circlet", characters: ["Sun Wukong", "Tang Sanzang", "Zhu Bajie"] },
    { id: "camel", channel: "modern", color: "#5f9962", title: "Rickshaw Boy", character: "Xiangzi", domain: "Survival", hook: "When dignity becomes expensive, what can one person protect?", subtitle: "A cart and a life", characters: ["Xiangzi", "Huniu", "Xiaofuzi"] },
    { id: "call", channel: "modern", color: "#356c99", title: "Call to Arms", character: "Runtu", domain: "Awakening", hook: "After life dulls us, how do we recognize one another again?", subtitle: "The old moon is not the same", characters: ["Runtu", "Xianglin Sao", "The Madman"] },
    { id: "miserables", channel: "world", color: "#8b5e94", title: "Les Misérables", character: "Jean Valjean", domain: "Mercy", hook: "Can one act of grace free someone from an old name?", subtitle: "The silver still shines", characters: ["Jean Valjean", "Fantine", "Cosette"] },
    { id: "pride", channel: "women", color: "#bd6d86", title: "Pride and Prejudice", character: "Elizabeth Bennet", domain: "Judgement", hook: "Can you admit that a first impression was wrong?", subtitle: "A choice beyond the ballroom", characters: ["Elizabeth Bennet", "Mr. Darcy", "Jane Bennet"] },
    { id: "little", channel: "women", color: "#4a8a7a", title: "Little Women", character: "Jo March", domain: "Selfhood", hook: "Ambition and love need not betray each other.", subtitle: "Writing a name in the attic", characters: ["Jo March", "Amy March", "Beth March"] },
  ],
};
