requirejs.config({
    baseUrl: "lib",
    paths: {
        activity: "../js"
    },
    shim: {
        'rot': {
            exports: 'ROT'
        },
        'rAF': {
            exports: 'rAF'
        },
    }
});

requirejs(["activity/activity"]);
