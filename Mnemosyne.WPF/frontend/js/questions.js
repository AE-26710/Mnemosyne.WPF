(function (global) {
    /**
     * formSections 的结构说明
     * @typedef {Object} Question
     * @property {string} key
     * @property {string} type
     * @property {string} title
     * @property {string} description
     * @property {*} defaultValue
     * @property {function} calcScore
     *
     * @typedef {Object} Section
     * @property {string} sectionId
     * @property {function} [showIf]
     * @property {Question[]} questions
     */

    /** @type {Question[]} */
    const functionalQuestion = [
        {
            key: 'q1', type: 'five',
            title: 'QD1 此次购买的核心动机是？',
            description: '区分功能性需求与心理补偿。前者侧重于解决生活或工作中的具体障碍，后者则更倾向于通过购买行为获取短暂的情感宣泄或变好的幻觉。',
            labelLeft: '解决明确问题', labelRight: '可能会用上',
            defaultValue: null,
            calcScore: (val) => val || 0
        },
        {
            key: 'q2', type: 'binary',
            title: 'QD2 如果今天不买，会在 72 小时内严重影响你的正常生活吗？',
            description: '判断该商品是否为维持当前生活水平的必需品。如果缺失该商品不会产生实质性的生活负面影响，则其属于可选消费。',
            defaultValue: null,
            calcScore: (val) => val === false ? 5 : 0
        },
        {
            key: 'q3', type: 'five',
            title: 'QD3 该商品的使用价值是否已被你当前拥有的物品覆盖？',
            description: '考察家中是否已有类似功能、类似用途的存量物品。若已有替代品，新增购买往往属于审美疲劳驱动而非功能驱动。',
            labelLeft: '无可替代', labelRight: '完全覆盖',
            defaultValue: null,
            calcScore: (val) => val || 0
        },
        {
            key: 'q4', type: 'binary',
            title: 'QD4 如果必须为它额外工作来填补账单，你还会买吗？',
            description: '将消费支出转化为个人的劳动时间。通过思考是否愿意为该商品额外加班或工作，来衡量该商品在个人价值排序中的真实权重。',
            defaultValue: null,
            calcScore: (val) => val === false ? 3 : 0
        },
        {
            key: 'q5', type: 'binary',
            title: 'QD5 是否存在成本更低的替代方案？',
            description: '评估决策前是否进行过充分的市场调研。很多时候人们倾向于一步到位购买高价品，而忽略了基础款或二手方案是否已能解决问题。',
            defaultValue: null,
            calcScore: (val) => val === true ? 3 : 0
        },
        {
            key: 'q6', type: 'five',
            title: 'QD6 你当前已经拥有多少个同类或高度相似的物品？',
            description: '针对囤积倾向的检查。如果你已经拥有复数个同类物品，新增的购买往往会带来极低甚至负向的维护成本负担。',
            labelLeft: '绝无仅有', labelRight: '泛滥成灾',
            defaultValue: null,
            calcScore: (val) => val || 0
        },
        {
            key: 'q7', type: 'five',
            title: 'QD7 新增该商品为你带来的实际效用提升是？',
            description: '评估该商品是带来了从无到有的突破，还是仅仅在现有基础上进行了微小的、非必要的性能加成。',
            labelLeft: '产生质变', labelRight: '几乎没有',
            defaultValue: null,
            calcScore: (val) => val || 0
        },
        {
            key: 'q8', type: 'binary',
            title: 'QD8 这笔消费是否会带来未来回报？',
            description: '考察消费是否具有投资属性。如果支出能转化为个人能力的提升、工作效率的增加或未来现金流的产生，则不视作纯粹的消耗。',
            defaultValue: null,
            calcScore: (val) => val === true ? -8 : 2
        },
    ];

    const questionEmotion = [
        {
            key: 'e1', type: 'binary',
            title: 'QE1 你此刻是否正处于饥饿、愤怒、孤独或疲惫的状态？',
            description: '评估购买行为是否是为了逃避当下的负面情绪。如果是，这属于典型的情绪代偿消费，冲动购买的概率极高。',
            defaultValue: null,
            calcScore: (val) => val === true ? 5 : 0
        },
        {
            key: 'e2', type: 'five',
            title: 'QE2 这笔消费是为了真实的你，还是为了你幻想中那个更好、更自律的你？',
            description: '如：为了“变瘦”买昂贵运动装备，却无运动习惯。',
            labelLeft: '完全是为了真实的我', labelRight: '完全是为了幻想的我',
            defaultValue: null,
            calcScore: (val) => val || 0
        },
        {
            key: 'e3', type: 'five',
            title: 'QE3 这笔消费带给你的新鲜感和快乐能持续多久？',
            description: "评估购买后的满足感持续时间。短暂的快感通常指向冲动消费，而能带来长久满足的购买则更可能是理性选择。",
            labelLeft: '几秒钟', labelRight: '几个月以上',
            defaultValue: null,
            calcScore: (val) => (3 - val) * 2 || 0
        },
        {
            key: 'e4', type: 'binary',
            title: 'QE4 你是否因为限时/稀有/绝版而产生购买冲动？',
            description: '评估情绪是否被厂商的运营手段所挟持，从而产生了“现在不买就亏了”的非理性错觉。',
            defaultValue: null,
            calcScore: (val) => val === true ? 8 : 0
        },
        {
            key: 'e5', type: 'binary',
            title: 'QE5 这笔消费是否具有赌博式不确定性？',
            description: '针对具有随机性质的消费行为（如抽卡、盲盒）。此类消费的核心卖点往往是不确定性带来的赌博快感，而非确定的商品使用价值。',
            defaultValue: null,
            calcScore: (val) => val === true ? 8 : 0
        },
        {
            key: 'e6',
            type: 'five',
            title: 'QE7 你认为3天后你后悔这笔消费的概率是？',
            description: '通过预测未来的后悔感来评估当前的冲动程度。较高的后悔概率通常意味着该消费缺乏理性支撑，更可能是情绪化的冲动购买。',
            labelLeft: '0%', labelRight: '100%',
            calcScore: (val) => val * 2 || 0
        }
    ];

    const questionFinance = [
        {
            key: 'f1', type: 'five',
            title: 'QF1 这笔消费占你月收入的比例大约是？',
            description: '衡量该消费在个人财务中的相对重量。较高的比例意味着更大的财务压力和更高的风险，尤其是当该消费并非必需品时。',
            defaultValue: null,
            labelLeft: '10%以下', labelRight: '50%以上',
            calcScore: (val) => val > 3 ? (val - 3) * 5 : (val - 3) * 1,
        },
        {
            key: 'f2', type: 'binary',
            title: 'QF2 这笔消费是否需要你使用分期付款、花呗/信用卡透支，且不在常规预算内？',
            description: '评估商品是否超出了当前的真实购买力。一旦涉及借贷或分期，说明它正在透支你未来的抗风险能力。',
            defaultValue: null,
            calcScore: (val) => val === true ? 10 : 0,
        },
        {
            key: 'f3', type: 'binary',
            title: 'QF3 这笔消费是否会是否会引发持续的额外支出？',
            description: '考察该商品是否会带来后续的维护成本、配件购买或升级换代等持续性支出。如果是，这笔消费的长期负担远高于其初始价格。',
            defaultValue: null,
            calcScore: (val) => val === true ? 5 : 0
        },
        {
            key: 'f4', type: 'five',
            title: 'QF4 在未来一年内，你使用该商品的频率大约是？',
            description: '评估商品的使用频率。较高的使用频率意味着更高的实际价值，而较低的使用频率则可能导致资源浪费。',
            defaultValue: null,
            labelLeft: '几乎不使用', labelRight: '每天使用',
            calcScore: (val) => 3 - val || 0
        },
        {
            key: 'f5', type: 'five',
            title: 'QF5 它容易被二手转卖或处理掉吗？',
            description: '评估物品的流动性与空间占用成本。如果该商品难以转手或处理掉，那么它的占有成本就会更高，从而增加了这笔消费的风险和负担。',
            defaultValue: null,
            labelLeft: '非常容易', labelRight: '非常困难',
            calcScore: (val) => val - 3 || 0
        }
    ];

    /** @type {Section[]} */
    const formSections = [
        {
            sectionId: 'basicInfo',
            questions: [
                {
                    key: 'b1', type: 'five',
                    title: 'QB1 该需求的触发源头是？',
                    description: '区分“主动寻找”与“被动投喂”。主动搜索通常源于内在需求，而推荐、直播、广告触发的需求往往是算法制造的瞬时错觉。',
                    labelLeft: '我主动寻找的', labelRight: '我被动接收的',
                    defaultValue: null,
                    calcScore: (val) => (val - 3) * 2 || 0
                },
                {
                    key: 'b2', type: 'five',
                    title: 'QB2 你在多大程度上是在为品牌溢价和身份标签付费？',
                    description: '考察支付的金额中有多少是为了非功能性因素买单。社交景观是指为了在社交圈层中展示身份、品味或获取他人认同而进行的符号化消费。',
                    labelLeft: '纯粹实用功能', labelRight: '纯粹社交景观',
                    defaultValue: null,
                    calcScore: (val) => val || 0
                },
                {
                    key: 'b3', type: 'binary',
                    title: 'QB3 如果没有任何人会知道你买了它，你还会买吗？',
                    description: '考察你对该物品的喜爱是源于内在的真实认可，还是源于外在的眼光。',
                    defaultValue: null,
                    calcScore: (val) => val === false ? 5 : 0,
                    showIf: (form) => form['b2'] >= 3
                },
                {
                    key: 'b4', type: 'five',
                    title: 'QB4 这个购买想法已经持续了多久？',
                    description: '衡量从产生购买念头到准备付诸行动的时间跨度。较短的时间通常指向瞬时的多巴胺冲动，而较长的决策周期则意味着需求经过了理性的反复验证。',
                    labelLeft: '1小时以内', labelRight: '7天以上',
                    defaultValue: null,
                    calcScore: (val) => (3 - val) * 2 || 0
                },
                {
                    key: 'router', type: 'binary',
                    title: 'QB5 此项消费的主要属性是？',
                    description: '界定消费客体在生活坐标系中的定位。“功能”指向具备明确生产力或实用价值的工具属性，侧重于解决具体问题；“娱乐”则指向纯粹的情绪价值或审美体验，侧重于满足精神层面的即时性愉悦。',
                    labelLeft: '功能', labelRight: '娱乐',
                    defaultValue: null,
                    calcScore: () => 0
                },
            ]
        },
        {
            sectionId: 'functional',
            questions: functionalQuestion,
            showIf: (form) => form['router'] === true,
        },
        {
            sectionId: 'emotion',
            questions: questionEmotion,
            showIf: (form) => form['router'] === false,
        },
        {
            sectionId: 'finance',
            questions: questionFinance,
        }
    ];

    global.MnemosyneQuestions = formSections;
})(window);
