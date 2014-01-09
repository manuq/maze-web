requirejs.config({
    baseUrl: "lib",
    paths: {
        activity: "../js"
    },
    shim: {
        'rot': {
            exports: 'ROT'
        },
    }
});

requirejs(["activity/activity"]);
