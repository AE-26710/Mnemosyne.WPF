(function (global) {
    /**
     * 通用日期选择组件
     * props:
     * - years: 可选年份数组
     * - year: 当前选中的年份 (v-model:year)
     * - month: 当前选中的月份 (v-model:month)
     * - showMonth: 是否启用月份选择块 (Boolean)
     */
    global.MnemosyneComponents = {
        DateFilter: {
            props: {
                years: { type: Array, required: true },
                year: { type: [Number, String], required: true },
                month: { type: [Number, String], default: '' },
                showMonth: { type: Boolean, default: false }
            },
            emits: ['update:year', 'update:month', 'change'],
            mounted() {
                // showMonth 是静态（不会改变）
                // 如果启用月份选择（showMonth === true），确保没有选择 "全年"（''），默认为 1 月
                if (this.showMonth) {
                    if (this.month === '' || this.month === null || this.month === undefined) {
                        this.$emit('update:month', 1);
                        this.$emit('change');
                    }
                } else {
                    // 如果不启用月份选择，确保 month 显示为 '全年'（空字符串）
                    if (this.month !== '') {
                        this.$emit('update:month', '');
                        this.$emit('change');
                    }
                }
            },
            template: `
                <div class="filter-section" style="margin: 20px 0; background: var(--bg-card); padding: 15px; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                    <label style="font-weight: 500;">选择年份:</label>
                    <select :value="year" 
                            @change="$emit('update:year', Number($event.target.value)); $emit('change')" 
                            class="custom-select">
                        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>

                    <label style="font-weight: 500; margin-left: 10px;">选择月份:</label>
                    <select :value="month"
                            :disabled="!showMonth"
                            @change="$emit('update:month', $event.target.value === '' ? '' : Number($event.target.value)); $emit('change')"
                            class="custom-select">
                        <option v-if="!showMonth" value="">全年</option>
                        <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                </div>
            `
        }
    };
})(window);