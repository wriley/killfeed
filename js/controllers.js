var app = angular.module("killfeedApp", []);

app.controller("killfeedController", function($scope, $http, $interval) {
// CHANGEME
    $scope.api_url = "URL";
    $scope.api_user = "USER";
    $scope.api_pass = "PASS";
//
//
    $scope.auth = "";
    $scope.auth_id = "";
    $scope.killfeedData = [];
    $scope.hostid = 10066;
    $scope.itemid = 26932;

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
                console.log("user.login failed with " + userData.error.message + ": " + userData.error.data);
            }  else {
                $scope.auth = userData.result;
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
                    "limit": 10,
                    "sortfield": "clock",
                    "sortorder": "DESC",
                },
                "auth": $scope.auth,
                "id": $scope.auth_id
            }).success(function (historyData) {
                if(historyData.error) {
                    console.log("history.get failed with " + historyData.error.message + ": " + historyData.error.data);
                } else {
                    //console.log(historyData);
                    for(var i = 0; i < historyData.result.length; i++) {
                        var val = historyData.result[i].value;
                        var time = "";
                        var killer = "";
                        var victim = "";
                        var weapon = "";
                        var distance = "";

                        if(val.indexOf(" hit by ") >= 0) {
                            var hitby_re = /^\s?(\d+:\d+:\d+) .*(\(.*\)) hit by PID#\d(\(.*\)) with (\w+)\/.* from (\d+) meters/;
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
                            var diedat_re = /^\s?(\d+:\d+:\d+) .*(\(.*\)) as .* died at (\w+)/;
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
                    }
                    $scope.killfeedData = historyData.result;
                }
            });
        }
    };

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                break;
            }
        }
    }

    fetch();
    $interval(fetch, 2000);
});
