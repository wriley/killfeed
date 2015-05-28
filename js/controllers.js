var app = angular.module("killfeedApp", ['ui.bootstrap']);

app.controller("killfeedController", function($scope, $http, $interval) {
//
// CHANGEME
    $scope.api_url = "URL";
    $scope.api_user = "USER";
    $scope.api_pass = "PASS";
    $scope.hostid = 10066;
    $scope.itemid = 26932;
//
//
    $scope.auth = "";
    $scope.auth_id = "";
    $scope.killfeedData = [];
    $scope.alerts = [];

    var login = function() {
        $scope.auth_id = Date.now();

        $http.post($scope.api_url, {
            "jsonrpc": "2.0",
            "method": "user.login",
            "params": {
                "user": $scope.api_user,
                "password": $scope.api_pass
            },
            "id": $scope.auth_id
        }).success(function (userData) {
            if (userData.error) {
                $scope.addAlert("danger", "user.login failed with " + userData.error.message + ": " + userData.error.data);
            }  else {
                $scope.auth = userData.result;
                fetch();
                $interval(fetch, 10000);
            }
        });
    };

    var fetch = function() {

        if($scope.auth == "") {
            login();
        } else {
            $scope.auth_id = Date.now();
                var time_till = Math.round(Date.now()/1000);
                var time_from = time_till - 900;
            $http.post($scope.api_url, {
                "jsonrpc": "2.0",
                "method": "history.get",
                "params": {
                    "output": "extend",
                    "history": 2,
                    "itemids": $scope.itemid,
                    "limit": 40,
                    "sortfield": "clock",
                    "sortorder": "DESC",
                },
                "auth": $scope.auth,
                "id": $scope.auth_id
            }).success(function (historyData) {
                if(historyData.error) {
                    $scope.addAlert("danger", "history.get failed with " + historyData.error.message + ": " + historyData.error.data);
                } else {
                    //console.log(historyData);
                    var lastVal;
                    for(var i = 0; i < historyData.result.length; i++) {
                        var val = historyData.result[i].value;
                        if(val == lastVal) { continue; }
                        var time = "";
                        var killer = "";
                        var victim = "";
                        var weapon = "";
                        var distance = "";

                        if(val.indexOf(" hit by ") >= 0) {
                            // 23:29:51 "P1ayer PID#4(Matt KT (Hero)) hit by PID#1(Taras Hujer) with M16A2/B_556x45_Ball <ammo left:30> from 3 meters"
                            var hitby_re = /^\s?(\d+:\d+:\d+) .*PID#\d+(\(.*\)) hit by PID#\d+(\(.*\)) with (\w+)\/.* from (\d+) meters/;
                            var pieces = hitby_re.exec(val);
                            if(pieces) {
                                pieces[2] = pieces[2].replace("(","");
                                pieces[2] = pieces[2].replace(")","");
                                pieces[3] = pieces[3].replace("(","");
                                pieces[3] = pieces[3].replace(")","");
                                time = pieces[1];
                                killer = pieces[3];
                                victim = pieces[2];
                                weapon = pieces[4];
                                distance = pieces[5];
                            }
                        }

                        if(val.indexOf(" died at ") >= 0) {
                            var diedat_re = /^\s?(\d+:\d+:\d+) .*PID#\d+(\(.*\)) as .* died at (\w+)/;
                            var pieces = diedat_re.exec(val);
                            if(pieces) {
                                pieces[2] = pieces[2].replace("(","");
                                pieces[2] = pieces[2].replace(")","");
                                time = pieces[1];
                                victim = pieces[2];
                                weapon = pieces[3];
                            }
                        }

                        historyData.result[i].time = time;
                        historyData.result[i].killer = killer;
                        historyData.result[i].victim = victim;
                        historyData.result[i].weapon = weapon;
                        historyData.result[i].distance = distance;

                        lastVal = val;
                    }
                    $scope.killfeedData = historyData.result;
                }
            });
        }
    };

    $scope.addAlert = function(type, msg) {
        var alert = {type: type, msg: msg};
        $scope.alerts.push(alert);
    }

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    }

    login();
});
