<!--
通用表单单元格组件
import BPCell from '@/components/Common/BPCell.vue'
<BPCell v-model="test"></BPCell>

@param
renderType = [
'index',
'html',
'normal',
'render',
]

jetty 2018-05
-->
<template>
    <div ref="cell">
        <template v-if="renderType === 'index'">{{getIndex}}</template>
        <template v-if="renderType === 'select'">
            <Checkbox :value="row['_checked']" @click.native.stop="handleClick" @on-change="toggleSelect"></Checkbox>
        </template>
        <template v-if="renderType === 'html'"><span v-html="row[`_${column.key}`]"></span></template>
        <template v-if="renderType === 'normal'"><span>{{getNotNull}}</span></template>
        <Cell v-if="renderType === 'render' && typeof column.render === 'function'"
                :row="row"
                :column="column"
                :index="rowIndex"
                :render="column.render"
        ></Cell>
    </div>
</template>
<script>
    import Cell from './expand'
    import {createCellTip, createLink, createTitle, isNull} from './BPTable.js'

    export default {
        name: 'TableCell',
        components: {Cell},
        props: {
            row: {
                type: Object,
                default: () => {
                    return {}
                }
            },
            column: {
                type: Object,
                default: () => {
                    return {}
                }
            },
            pages: {
                type: Object,
                default: () => {
                    return {}
                }
            },
            checked: Boolean,
            colIndex: Number,
            rowIndex: Number,           // _index of data
            disabled: Boolean,
            fixed: {
                type: [Boolean, String],
                default: false
            }
        },
        data () {
            return {
                renderType: ''
            }
        },
        computed: {
            getNotNull () {
                let val = this.row['_' + this.column.key]
                if (isNull(val)) {
                    return ' '
                }
                return val
            },
            getIndex () {
                if (JSON.stringify(this.pages) !== '{}') {
                    return this.rowIndex + (this.pages.current - 1) * (this.pages.size || 10) + 1
                }
                return this.rowIndex + 1
            }
        },
        methods: {
            toggleSelect () {
                this.$parent.toggleSelect(this.rowIndex)
            },
            handleClick () {
                // 放置 Checkbox 冒泡
            }
        },
        created () {
            if (this.column.type === 'index') {
                this.renderType = 'index'
            } else if (this.column.type === 'html') {
                this.renderType = 'html'
            } else if (this.column.type === 'select') {
                this.renderType = 'select'
            } else if (this.column.cellTip) {
                this.column.render = createCellTip()
                this.renderType = 'render'
            } else if (this.column.link) {
                this.column.render = createLink()
                this.renderType = 'render'
            } else if (this.column.cellTitle) {
                this.column.render = createTitle()
                this.renderType = 'render'
            } else if (this.column.render) {
                this.renderType = 'render'
            } else {
                this.renderType = 'normal'
            }
        }
    }
</script>
<style lang="less" scoped>
    span {
        padding: 0 6px;
    }

    a {
        padding: 0 6px;
    }
</style>
