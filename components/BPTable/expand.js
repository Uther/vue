/*
* render 模式赋值
* jetty 2015.05
* */
export default {
    name: 'TableExpand',
    functional: true,
    props: {

        render: Function,
        index: Number,
        row: {
            type: Object,
            default: null
        },
        column: {
            type: Object,
            default: null
        }
    },
    render: (h, ctx) => {
        const params = {
            index: ctx.props.index
        }
        if (ctx.props.row) params.row = ctx.props.row
        if (ctx.props.column) params.column = ctx.props.column
        return ctx.props.render(h, params)
    }
}
