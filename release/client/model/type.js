define(function () {
    return{
        url: './data/data.json',
        param: {},
        execute: function (success) {
            $.get(this.url, this.param, function (data) {
                success(data);
            })
        }
    };
})


