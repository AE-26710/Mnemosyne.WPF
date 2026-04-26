(function (global) {
    /**
     * @typedef {{ template: (total: number) => string }} MnemosyneEcho
     */

    /**
     * @type {MnemosyneEcho[]}
     */
    const Echoes = [
        {
            template: (total) => `本月的支出相当于消费了 <b>${(total / 1.7).toFixed(0)}</b> 罐三〇六寝室标准规格的可乐 (330ml)。`,
        },
        {
            template: (total) => `本月支出相当于 <b>${(total / 23499).toFixed(4)}</b> 张 RTX 5090 D 。`,
        },
        {
            template: () => `Mnemosyne 不仅仅是记忆女神，她还是 <b>9 位缪斯女神</b>的母亲。`
        },
        {
            template: () => `在古希腊，人们相信在转生前要喝“忘川”(Lethe) 的水来忘却前世，而喝了“冥想泉”(Mnemosyne) 的水则能获得全知。`
        },
        {
            template: (total) => {
                const goldPrice = 1049;
                return `如果你将本月支出的纸币换成黄金，大约是 <b>${(total / goldPrice).toFixed(3)}</b> 克。`;
            }
        },
        {
            template: (total) => `按 0.6 元/度的电费计算，本月支出能支撑你的 <b>R9 9950X</b> 以满载功耗连续运行 <b>${(total / 0.6 / 0.17).toFixed(0)}</b> 小时。`
        },
        {
            template: () => `Mnemosyne 不仅掌管记忆，她还被认为是<strong>时间</strong>的创造者之一，因为只有通过记忆，人类才能感知过去与未来的存在。`
        },
        {
            template: (total) => `如果将本月支出的纸币首尾相接，它们大约能铺满 <b>${(total / 100 * 0.15).toFixed(2)}</b> 米。虽然不长，但每一步都是生活的痕迹。`
        },
        {
            template: (total) => `如果本月支出是一次 648 充值，你已经完成了 <b>${(total / 648).toFixed(2)}</b> 次。距离“6+5”的执念，你又迈进了一步。`
        },
        {
            template: () => `Mnemosyne 不仅是记忆女神，在赫西俄德的记载中，她还是唯一能准确叫出宇宙中每一颗星辰名字的神明。`
        },
        {
            template: () => `记忆 (Mnemosyne) 是抵抗时间流逝的唯一锚点。如果没有她，我们的生活就像是在漏水的水桶中盛装光阴。`
        },
        {
            template: () => `在俄耳甫斯教的传统中，死者被告诫要避开“忘川”的左侧，去寻找“记忆之泉”的清凉，以保持灵魂的觉醒。`
        },
        {
            template: (total) => `如果将本月支出全部换成 1 元硬币并垂直叠放，它们的高度将达到 <b>${(total * 1.85 / 1000).toFixed(2)}</b> 米。`
        },
        {
            template: () => `遗忘是人类的本能，而记录是对抗时间的唯一武器。`
        },
        {
            template: (total) => `你的本月支出是资本循环中的一个微小环节：M → C → M'。只不过 M' 不在你手里。`
        },
        {
            template: (total) => `普鲁斯特的“小玛德莱娜”点心撬动了整部《追忆似水年华》。而本月消费最高的那一笔，或许也会在多年后成为撬动你某段回忆的开关。`
        },
        {
            template: () => `赫拉克利特说，人不能两次踏入同一条河流。但 Mnemosyne 让你能反复审视同一条支出记录，并发现那时的自己多么天真。`
        },
        {
            template: () => `阿多诺认为大众文化是“文化工业”。你对流萤的喜爱，是否也是一种被精心计算出来的消费文化反馈？`
        },
        {
            template: (total) => `<b>商品拜物教：</b>你支付的 ¥${total} 不仅仅是数字，它掩盖了凝结在对象中的社会劳动。在这笔交易中，人与人的关系被异化成了物与物的关系。`
        },
        {
            template: () => `<b>异化劳动：</b>马克思指出，人越是在劳动中耗费力量，他亲手创造出来的、反对他的、异己的对象世界就越强大，他本身就越贫乏。`
        },
        {
            template: () => `<b>符号消费：</b>鲍德里亚认为，在晚期资本主义中，你购买的不再是物品的使用价值，而是其背后的“符号”地位。`
        },
        {
            template: () => `马克思在《1844年经济学哲学手稿》中提出“异化劳动”：你生产得越多，属于你自己的就越少。录入这笔账单时，不妨问问自己：这究竟是“消费”，还是资本循环中一次短暂的“喘息”？`
        },
        {
            template: () => `正如列宁所说：“资本是一种社会力量。”在你工作的每一天里，这种力量都在温柔地注视着你。`
        },
        {
            template: () => `<b>消费主义：</b>它并不总是命令你购买，有时只是温柔地告诉你：“你值得更好的。”`
        },
        {
            template: () => `<b>景观社会：</b>有些消费不是为了使用，而是为了证明自己曾经接近某种被展示出来的生活。`
        },
        {
            template: () => `资本最精巧的地方，不是强迫你欲望某物，而是让你误以为这个欲望从一开始就属于自己。`
        },
        {
            template: () => `当商品开始替你定义身份时，消费就不再只是消费，而成了一种关于“我是谁”的临时答案。`
        },
        {
            template: () => `<span style="color: var(--color-firefly);">如果这些支出能换来一些美好的回忆……我想，它们就不仅仅是数字。对吗？</span>`
        },
        {
            template: () => `<span style="color: var(--color-firefly);">生命有限，预算也是。正因为如此，我们才要认真选择，把它们交给什么。</span>`
        },
        {
            template: () => `<span style="color: var(--color-firefly);">下一次消费前，先问问自己吧：这是为了逃离疲惫，还是为了靠近真正想要的生活？</span>`
        },
        {
            template: () => `<span style="color: var(--color-firefly);">我希望你能好好生活。不是只在消费的时候感到快乐，而是在不消费的时候，也能安心地呼吸。</span>`
        },
        {
            template: () => `<span style="color: var(--color-raiden-mei);">雷鸣是为了审判，而记录是为了律己。如果欲望像崩坏能一样失控，我会亲手帮你截断它。明白了吗？</span>`
        },
        {
            template: () => `<span style="color: var(--color-raiden-mei);">记账是一个好习惯。掌控自己的支出，才能掌控自己的生活。如果你觉得最近开销太大，下次的便当我来帮你准备吧。</span>`
        },
        {
            template: () => `<span style="color: var(--color-raiden-mei);">支出需要有计划。每一笔开销的背后都是一段时间的付出。在满足欲望之前，请务必先确认本月的生存预算。</span>`
        },
        {
            template: () => `<span style="color:#b2b7f2;">哎呀，别盯着那个数字看啦！如果是为了让自己开心，或者是为了给重要的人买礼物，花掉多少钱都没关系吧！</span>`
        },
        {
            template: () => `<span style="color:#3e4a4d;">警督，根据账单显示，你在非必要物资上的支出频率正在上升。虽然这不违反法律，但在逻辑上，这不利于你维持长期的财务秩序。</span>`
        },
        {
            template: () => `<span style="color: var(--color-makise-kurisu);">别用那种奇怪的眼神看着我！我才不是在关心你，我只是在进行客观的财务审计。不过……适当的犒劳自己也是人类心理调节的一部分，只要别过度就行。</span>`
        },
        {
            template: () => `<span style="color: var(--color-kafka);">如果不学会掌控自己的欲望，你最终会成为欲望的奴隶。到时候，你的意志还属于你吗？</span>`
        },
        {
            template: () => `<span style="color: var(--color-kafka);">如果你认为每一次消费都是完全自主的选择，那或许只是因为你还没意识到，自己正行走在某条被精心规划的轨道上。</span>`
        },
        {
            template: () => `<span style="color: var(--color-kafka);">「听我说」：你并不真的需要那件商品。你需要的只是拆开包装时，那一瞬间被填补的空虚感。</span>`
        },
    ];
    global.MnemosyneEchoes = Echoes;
})(window);
