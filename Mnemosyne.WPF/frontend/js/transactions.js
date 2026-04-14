const { createApp, ref, reactive, computed } = Vue;

createApp({
    components: {
        'audit-scale-five': MnemosyneComponents.AuditScaleFive,
        'audit-scale-binary': MnemosyneComponents.AuditScaleBinary
    },
    setup() {
        const rootStyle = getComputedStyle(document.documentElement);
        const colorIntellect = (rootStyle.getPropertyValue('--color-intellect')).trim();
        const colorPsyche = (rootStyle.getPropertyValue('--color-psyche')).trim();
        const colorPsysique = (rootStyle.getPropertyValue('--color-psysique')).trim();
        const colorMotorics = (rootStyle.getPropertyValue('--color-motorics')).trim();
        const mutedTextColor = (rootStyle.getPropertyValue('--color-text-muted')).trim();

        /**
         * formSections 的结构说明
         * @typedef {Object} Question
         * @property {string} key
         * @property {string} type
         * @property {string} title
         * @property {*} defaultValue
         * @property {function} calcScore
         *
         * @typedef {Object} Section
         * @property {string} sectionId
         * @property {function} [showIf]
         * @property {Question[]} questions
         */

        /**
         * 计分原则：分数越高，越属于“异化/冲动/浪费”的消费。
         * 五分量表 (val: 1-5)：正向问题直接取 val；反向问题取 6 - val。
         * 二元开关 (val: true/false)：错误选项给高分，正确选 0 分。
         */

        /** @type {Question[]} */
        const defaultQuestion = [
            {
                key: 'q1', type: 'five',
                title: 'QD1 此次购买的核心动机是？',
                labelLeft: '解决明确生存/工作问题', labelRight: '仅仅是“买了感觉会更好”',
                defaultValue: null,
                calcScore: (val) => val || 0
            },
            {
                key: 'q2', type: 'binary',
                title: 'QD2 如果今天不买，会在 72 小时内严重影响你的正常生活吗？',
                defaultValue: null,
                calcScore: (val) => val === false ? 5 : 0
            },
            {
                key: 'q3', type: 'five',
                title: 'QD3 该商品的使用价值是否已被你当前拥有的物品覆盖？',
                labelLeft: '无可替代', labelRight: '完全覆盖',
                defaultValue: null,
                calcScore: (val) => val || 0
            },
            {
                key: 'q4', type: 'five',
                title: 'QD4 这个购买想法已经持续了多久？',
                labelLeft: '1小时以内', labelRight: '7天以上',
                defaultValue: null,
                calcScore: (val) => val ? (6 - val) : 0
            },
            {
                key: 'q5', type: 'binary',
                title: 'QD5 如果必须为它额外工作来填补账单，你还会买吗？',
                defaultValue: null,
                calcScore: (val) => val === false ? 3 : 0
            },
            {
                key: 'q6', type: 'binary',
                title: 'QD6 是否存在成本更低的替代方案，且你已经尝试过？',
                defaultValue: null,
                calcScore: (val) => val === false ? 3 : 0
            },
            {
                key: 'q7', type: 'five',
                title: 'QD7 你在多大程度上是在为品牌溢价和身份标签付费？',
                labelLeft: '纯粹实用功能', labelRight: '纯粹社交景观',
                defaultValue: null,
                calcScore: (val) => val || 0
            },
            {
                key: 'q8', type: 'binary',
                title: 'QD8 如果没有任何人会知道你买了它，你还会买吗？',
                defaultValue: null,
                calcScore: (val) => val === false ? 5 : 0,
                showIf: (form) => form['q7'] >= 3
            },
            {
                key: 'q9', type: 'five',
                title: 'QD9 你当前已经拥有多少个同类或高度相似的物品？',
                labelLeft: '绝无仅有', labelRight: '泛滥成灾',
                defaultValue: null,
                calcScore: (val) => val || 0
            },
            {
                key: 'q10', type: 'five',
                title: 'QD10 新增该商品为你带来的实际效用提升是？',
                labelLeft: '产生质变', labelRight: '几乎没有',
                defaultValue: null,
                calcScore: (val) => val || 0
            },
            {
                key: 'q11', type: 'binary',
                title: 'QD11 这笔消费是否会带来未来回报（知识 / 技能 / 生产力）？',
                defaultValue: null,
                calcScore: (val) => val === true ? -5 : 5
            },
        ];

        // 游戏/数字内购问题
        /** @type {Question[]} */
        const gameQuestion = [
            {
                key: 'g1', type: 'binary',
                title: 'QG1 你是否因为限时/稀有/绝版而产生购买冲动？',
                defaultValue: null,
                calcScore: (val) => val === true ? 8 : 0
            },
            {
                key: 'g2', type: 'binary',
                title: 'QG2 这笔消费是否用于追赶进度/避免落后他人?',
                defaultValue: null,
                calcScore: (val) => val === true ? 8 : 0
            },
            {
                key: 'g3', type: 'binary',
                title: 'QG3 此次消费是否受到沉没成本的影响？',
                defaultValue: null,
                calcScore: (val) => val === true ? 8 : 0
            },
            {
                key: 'g4', type: 'binary',
                title: 'QG4 这笔消费是否具有赌博式不确定性（如抽卡/开箱）？',
                defaultValue: null,
                calcScore: (val) => val === true ? 8 : 0
            }
        ];

        /** @type {Section[]} */
        const formSections = [
            {
                sectionId: 'basicInfo',
                questions: [
                    {
                        key: 'b1', type: 'binary',
                        title: 'QB1 这是否是一笔数字增值/虚拟商品支出？',
                        defaultValue: null,
                        calcScore: (val) => 0 // 路由问题，本身不产生分数
                    },
                ]
            },
            {
                sectionId: 'default',
                questions: defaultQuestion,
                showIf: (form) => form['b1'] === false,
            },
            {
                sectionId: 'game',
                questions: gameQuestion,
                showIf: (form) => form['b1'] === true,
            }
        ];

        /** 审核表单响应式对象 */
        const auditForm = reactive({});
        /**
         * 初始化表单字段为默认值
         */
        const initForm = () => {
            formSections.forEach(section => {
                section.questions.forEach(q => {
                    auditForm[q.key] = q.defaultValue;
                });
            });
        };

        /**
         * 计算审核状态，包括过滤后的数据和总分
         * 说明：只对可见组和可见题目进行计分；五分量表未选择使用 0 表示，二元未选择使用 null 表示。
         */
        const auditState = computed(() => {
            const result = {
                filteredData: {},
                score: 0
            };

            formSections.forEach(section => {
                // 如果组被隐藏，直接跳过
                if (section.showIf && !section.showIf(auditForm)) return;

                section.questions.forEach(q => {
                    // 如果题被隐藏，直接跳过
                    if (q.showIf && !q.showIf(auditForm)) return;

                    const val = auditForm[q.key];

                    // 1. 收集清洗后的数据
                    result.filteredData[q.key] = val;

                    // 2. 累加分数 (需确保有 calcScore 方法且值已选择)
                    if (q.calcScore && val !== null && val !== undefined && val !== 0 && val !== '') {
                        result.score += q.calcScore(val);
                    }
                    result.score = Math.max(result.score, 0);
                });
            });

            return result;
        });

        // 立即初始化表单
        initForm();
        /** 计算参考分数 */
        const riskScore = computed(() => auditState.value.score);

        const scoreAssessment = computed(() => {
            const score = riskScore.value;

            if (score === 0 && auditForm['b1'] === null) {
                return {
                    level: "边缘系统 Limbic System",
                    text: "页面是一片雪白。欲望还未被具象化。某种情绪在远处酝酿，像雾一样，流动而模糊。你还不确定自己想要什么，但你*隐约*感觉那会让你好受一点。仅此而已。",
                    color: mutedTextColor,
                };
            }

            if (score < 12) {
                return {
                    level: "博学多闻 Encyclopedia",
                    text: "自由市场的伟大之处在于它能将一切明码标价。你正在完成一次标准的商品流转。恭喜。你为全球化供应链的运转、以及某位远方资本家的挥霍无度，贡献了微不足道的一点力量。",
                    color: colorIntellect
                };
            }

            if (score < 24) {
                return {
                    level: "疑神疑鬼 Half Light",
                    text: "有点不对劲。说不上来哪里，但有什么东西在推动你加快决策。太快了。这种速度通常意味着你正在失去主动权。",
                    color: colorPsyche,
                };
            }

            if (score < 36) {
                return {
                    level: "通情达理 Empathy",
                    text: "一阵潮湿、冰冷的悲伤像涨潮的海水一样漫过你的胸腔。你并不是真的渴望这个工业制品。你只是太累了。你正试图用一叠叠标着数字的纸片，去填塞你灵魂深处那个永不满足的空洞。",
                    color: colorPsyche
                };
            }

            return {
                level: "食髓知味 Electrochemistry",
                text: "喔！看看这个！这正是我们需要的，宝贝！管它什么异化，管它什么剥削！把钱扔出去，换取那几秒钟的快感！快点，在你的意识还没清醒过来之前！",
                color: colorPsysique
            };
        });

        const totalRiskScore = computed(() => riskScore.value);

        return {
            formSections,
            auditState,
            auditForm,
            riskScore,
            scoreAssessment,
            totalRiskScore
        };
    }
}).mount('#app');
