# 2.0.0 - 2017/2/12

* Updated Standard dependency to 9.0.0, enforce camelCase.
* Updated Opbeat version to 4.11.0. this version introduces two new functions in the Opbeat client - [setUserContext](https://opbeat.com/docs/articles/nodejs-agent-api/#setusercontext) and [setExtraContent](https://opbeat.com/docs/articles/nodejs-agent-api/#setextracontext). `bunyan-opbeat` now uses these to send user and extra data to opbeat.

There are no api changes in `bunyan-opbeat` the major version bump is due to Opbeat's module major version bump.
