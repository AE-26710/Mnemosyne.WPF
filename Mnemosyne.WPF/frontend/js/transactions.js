(function() {
const { createApp, ref, reactive, computed, onMounted } = Vue;
const { formatCurrency: formatExpenseCurrency, yuanToCents } = MnemosyneUtils;

const app = createApp({
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

        const PLATFORM_OPTIONS = window.PLATFORM_OPTIONS;
        const records = ref([]);
        const currentPage = ref(1);
        const totalPages = ref(1);
        const formModal = ref({
            show: false,
            isEditing: false,
            editingId: null,
            selectedPlatform: PLATFORM_OPTIONS[0],
            date: { year: '', month: '', day: '' },
            data: { itemName: '', platform: '', amount: '', tagsInput: '' }
        });

        const showAuditForm = ref(false);
        const isEditing = ref(false);
        const editingId = ref(null);
        const selectedPlatform = ref(PLATFORM_OPTIONS[0]);
        const showDeleteConfirm = ref(false);
        const pendingDeleteId = ref(null);

        const filters = ref({
            datePeriod: '全部时间',
            platform: '全部平台',
            tags: [],
            amountRange: [null, null],
        })

        const fetchRecords = async (page = 1) => {
            try {
                const json = await api.getExpenses(page, 10);
                records.value = json.data;
                currentPage.value = json.page;
                totalPages.value = json.totalPages;
            } catch (error) {
                console.error('Failed to fetch records:', error);
            }
        };

        const changePage = (newPage) => {
            if (newPage >= 1 && newPage <= totalPages.value) {
                fetchRecords(newPage);
            }
        };

        const openForm = () => {
            formModal.value.isEditing = false;
            formModal.value.editingId = null;

            const today = new Date();
            formModal.value.date = {
                year: today.getFullYear().toString(),
                month: String(today.getMonth() + 1).padStart(2, '0'),
                day: String(today.getDate()).padStart(2, '0'),
            };

            formModal.value.data = {
                itemName: '',
                platform: PLATFORM_OPTIONS[0],
                amount: '',
                tagsInput: '',
            };
            formModal.value.selectedPlatform = PLATFORM_OPTIONS[0];
            formModal.value.show = true;
        };

        const editItem = (item) => {
            formModal.value.isEditing = true;
            formModal.value.editingId = item.id;

            let y = '';
            let m = '';
            let d = '';
            if (item.expenseDate) {
                const parts = item.expenseDate.split('-');
                if (parts.length === 3) {
                    [y, m, d] = parts;
                }
            }
            formModal.value.date = { year: y, month: m, day: d };

            formModal.value.data = {
                itemName: item.itemName,
                platform: item.platform,
                amount: formatExpenseCurrency(item.amount),
                tagsInput: item.tagsList ? item.tagsList.join(',') : '',
            };

            formModal.value.selectedPlatform = PLATFORM_OPTIONS.includes(item.platform) ? item.platform : '__custom__';
            formModal.value.show = true;
        };

        const onPlatformChange = () => {
            if (formModal.value.selectedPlatform === '__custom__') {
                if (PLATFORM_OPTIONS.includes(formModal.value.data.platform)) {
                    formModal.value.data.platform = '';
                }
            } else {
                formModal.value.data.platform = formModal.value.selectedPlatform;
            }
        };

        const closeForm = () => {
            formModal.value.show = false;
        };

        const submitForm = async () => {
            const strY = formModal.value.date.year;
            const strM = formModal.value.date.month;
            const strD = formModal.value.date.day;

            if (!strY || !strM || !strD || isNaN(strY) || isNaN(strM) || isNaN(strD)) {
                alert('请输入有效的年月日数字！');
                return;
            }

            const y = parseInt(strY, 10);
            const m = parseInt(strM, 10);
            const d = parseInt(strD, 10);

            const dateObj = new Date(y, m - 1, d);
            if (dateObj.getFullYear() !== y || dateObj.getMonth() + 1 !== m || dateObj.getDate() !== d) {
                alert('请输入正确有效的日期！');
                return;
            }

            const finalDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const payload = {
                expenseDate: finalDate,
                itemName: formModal.value.data.itemName,
                platform: formModal.value.data.platform,
                amount: yuanToCents(formModal.value.data.amount),
                tags: formModal.value.data.tagsInput
                    ? formModal.value.data.tagsInput
                        .split(',')
                        .map((t) => t.trim())
                        .filter((t) => t)
                    : [],
            };

            if (!Number.isFinite(payload.amount)) {
                alert('请输入有效金额！');
                return;
            }

            try {
                if (formModal.value.isEditing) {
                    await api.updateExpense(formModal.value.editingId, payload);
                } else {
                    await api.addExpense(payload);
                }
                closeForm();
                fetchRecords(currentPage.value);
            } catch (e) {
                alert('保存失败: ' + e.message);
            }
        };

        const deleteItem = async (id) => {
            pendingDeleteId.value = id;
            showDeleteConfirm.value = true;
        };

        const closeDeleteConfirm = () => {
            showDeleteConfirm.value = false;
            pendingDeleteId.value = null;
        };

        const confirmDelete = async () => {
            if (pendingDeleteId.value == null) return;
            try {
                await api.deleteExpense(pendingDeleteId.value);
                closeDeleteConfirm();
                fetchRecords(currentPage.value);
            } catch (e) {
                alert('删除失败: ' + e.message);
            }
        };

        const openAuditForm = () => {
            showAuditForm.value = true;
        };

        const closeAuditForm = () => {
            showAuditForm.value = false;
        };

        const formSections = window.MnemosyneQuestions;

        // --- Echo Logic ---
        const mockMonthlyTotal = 256.50;
        /** @type {{ template: (total: number) => string }[]} */
        const echoes = window.MnemosyneEchoes || [{ template: () => '如果你看到这条消息，说明有错误发生。' }];

        const currentEchoHtml = ref('');
        const isEchoVisible = ref(true);
        let currentEchoIndex = -1;

        const refreshEcho = () => {
            isEchoVisible.value = false;
            setTimeout(() => {
                let newIndex;
                do {
                    newIndex = Math.floor(Math.random() * echoes.length);
                } while (newIndex === currentEchoIndex);

                currentEchoIndex = newIndex;
                const echo = echoes[currentEchoIndex];
                currentEchoHtml.value = echo.template(mockMonthlyTotal);
                isEchoVisible.value = true;
            }, 200);
        };

        onMounted(() => {
            refreshEcho();
            fetchRecords(1);
        });

        /** 审计表单响应式对象 */
        const auditForm = reactive({
            itemName: '',
            platform: PLATFORM_OPTIONS[0],
            amount: null,
        });
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

                    // 2. 累加分数
                    if (q.calcScore && val !== null && val !== undefined && val !== 0 && val !== '') {
                        result.score += q.calcScore(val);
                    }
                });
            });
            result.score = Math.max(0, result.score);
            return result;
        });

        // 立即初始化表单
        initForm();
        /**
         * 检查是否所有问题都未被填写
         * @returns {boolean}
         */
        const isAllQuestionsEmpty = () => {
            for (const section of formSections) {
                for (const q of section.questions) {
                    const val = auditForm[q.key];
                    if (val !== null && val !== undefined && val !== '') {
                        return false;
                    }
                }
            }
            return true;
        };
        /** 计算参考分数 */
        const riskScore = computed(() => auditState.value.score);

        const scoreAssessment = computed(() => {
            const score = riskScore.value;

            // 如果所有题目都未被填写，则展示未开始状态文案
            if (isAllQuestionsEmpty()) {
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
                    text: "一阵潮湿、冰冷的悲伤像涨潮的海水一样漫过你的胸腔。你并不是真的渴望这个工业制品。你只是太累了。你正试图用一叠叠印着虚假面额的废纸，去填塞你灵魂深处那个永不满足的空洞。",
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
            PLATFORM_OPTIONS,
            records,
            currentPage,
            totalPages,
            changePage,
            formatCurrency: formatExpenseCurrency,
            formModal,
            filters,
            platformOptions: PLATFORM_OPTIONS,
            selectedPlatform,
            showDeleteConfirm,
            openForm,
            editItem,
            closeForm,
            onPlatformChange,
            submitForm,
            deleteItem,
            closeDeleteConfirm,
            confirmDelete,
            showAuditForm,
            openAuditForm,
            closeAuditForm,
            formSections,
            auditState,
            auditForm,
            riskScore,
            scoreAssessment,
            totalRiskScore,
            currentEchoHtml,
            isEchoVisible,
            refreshEcho
        };
    }
});
app.use(ElementPlus);
app.mount('#app');
})();
