angular.module('homeready').controller('LoginCtrl', function($scope, $ionicPopup, $q, $ionicNavBarDelegate, $rootScope, $http, $cordovaNetwork, $cordovaDevice, homereadyConfig, $state, force) {
    //var networkState = navigator.connection.type;
    $scope.$on('$ionicView.loaded', function() {
        $rootScope.menuOverlay = false;
        $rootScope.backButton = false;
        $rootScope.menuToggle = false;
        $rootScope.walkThrough = false;
        //console.log(Date.now());

    });
    
    $rootScope.iPad = true;
    var server = homereadyConfig.productionURL + '/services/oauth2/token';
    $scope.resetUrl = homereadyConfig.productionURL + '/secur/forgotpassword.jsp?locale=us&un=';
    var option = {
        loginURL: homereadyConfig.productionURL
    };
    $rootScope.initServer = homereadyConfig.productionCommunityURL;
    var userMap = [];
    //Get user type
    var getUser = function() {
        var defer = $q.defer();
        var params = {},
            headers = {},
            url = $rootScope.initServer + '/services/apexrest/User/';   //Calls apex class "HomereadyUsertype"

        $http({
                headers: headers,
                method: 'GET',
                url: url,
                params: params
            })
            .success(function(data, status, headers, config) {
                userMap = JSON.parse(data);
                //console.log(userMap);
                defer.resolve(userMap);
            })
            .error(function(data, status, headers, config) {
                defer.reject(data);
            });
        return defer.promise;
    };


    $scope.error = false;
    $rootScope.uat = 'Production';
    $scope.prodStyle = {
        'font-size': '15pt'
    };
    $scope.sandStyle = {
        'font-size': '10pt'
    };
    $scope.typeOptions = [{
        name: 'Production',
        value: '0'
    }, {
        name: 'Test',
        value: '1'
    }];
    //var option = $scope.typeOptions;
    //Defaulting Production Org
    $scope.form = {
        type: $scope.typeOptions[0].value
    };


    $scope.showAlert = function() {
        var alertPopup = $ionicPopup.alert({
            title: 'Environment Changed',
            template: 'Changed to ' + $rootScope.uat
        });

        alertPopup.then(function(res) {
            //console.log('Thank you for not eating my delicious ice cream cone');
        });
    };

    $scope.resetPassword = function(username) {
        getUser().then(function() {
            var flag = true;
            if (username && userMap) {
                angular.forEach(userMap, function(user) {
                    if (user.Username.toLowerCase() == username.toLowerCase()) {
                        if (user.UserType == 'PowerPartner') {
                            window.open($rootScope.initServer + '/secur/forgotpassword.jsp?locale=us&un=' + username, '_blank', 'location=no');
                            flag = false;
                        }
                    }
                });
            }
            if (username && flag) {
                window.open($scope.resetUrl + username, '_blank', 'location=no');
            }
            if (!username) {
                var failedPopup = $ionicPopup.alert({
                    title: 'Failed!',
                    template: "Please Provide Username"
                });
            }
        });
    };
    // Toggle org
    $scope.toggle = function() {
        if ($rootScope.uat == 'Test') {
            $scope.prodStyle = {
                'font-size': '15pt'
            };
            $scope.sandStyle = {
                'font-size': '10pt'
            };
            server = homereadyConfig.productionURL + '/services/oauth2/token';
            $scope.resetUrl = homereadyConfig.productionURL + '/secur/forgotpassword.jsp?locale=us&un=';
            option = {
                loginURL: homereadyConfig.productionURL
            };
            $rootScope.initServer = homereadyConfig.productionCommunityURL;
            force.init(option);
            $rootScope.uat = 'Production';
            $scope.form = {
                type: $scope.typeOptions[0].value
            };
            $scope.showAlert();
        } else {
            $scope.prodStyle = {
                'font-size': '10pt'
            };
            $scope.sandStyle = {
                'font-size': '15pt'
            };
            server = homereadyConfig.testURL + '/services/oauth2/token';
            $scope.resetUrl = homereadyConfig.testURL + '/secur/forgotpassword.jsp?locale=us&un=';
            option = {
                loginURL: homereadyConfig.testURL
            };
            $rootScope.initServer = homereadyConfig.testCommunityURL;
            force.init(option);
            $rootScope.uat = 'Test';
            $scope.form = {
                type: $scope.typeOptions[1].value
            };
            $scope.showAlert();
        }
        $scope.error = false;
    };

    var saveLoginHistory = function() {
        var deviceID = $cordovaDevice.device.uuid;
        console.log(deviceID);
        var userID = $rootScope.user.Id;
        var dateTime = new Date();
        var role = 'Vendor';
        if ($rootScope.isVerifier)
            role = 'Verifier';
        localforage.getItem('updateQueue').then(function(data) {
                if (data) {
                    $rootScope.updateQueue = data;
                } else {
                    $rootScope.updateQueue = [];
                }
            },
            function(error) {
                console.log(error);
            });
        $rootScope.updateQueue.push({  //Maintains a ques for all the updates
            type: 'Login_History__c',
            isNew: true,
            fields: {
                Device_Id__c: deviceID,
                Login_Date_Time__c: dateTime,
                Role__c: role,
                User__c: userID
            }
        });
    };

    //Sign in user
    $scope.signIn = function(username, password) {
      if (!$rootScope.isOnline || $cordovaNetwork.connection == 'none') {
          $scope.error = "You seem to be Offline!";
          localforage.getItem('User').then(function(data) {
              if (data) {
                  $rootScope.user = data;
                  if (!$rootScope.user.isVerifier) {
                      $rootScope.isVerifier = false;
                  }
                  $rootScope.offlineMode = true;
                  console.log("User Found!");
                  $rootScope.isOnline = false;
                  $state.go('landing');
              }
          }, function(error) {
              console.log(error);
          });
      }
      else
        getUser().then(function() {
            $scope.error = "";
            var flag = false;
            var error = true;
            if (username) {
                angular.forEach(userMap, function(user) {
                    if (user.Username.toLowerCase() == username.toLowerCase()) {
                        $rootScope.user = user;
                        error = false;
                        //localStorage.user = JSON.stringify(user);
                        if (user.UserType == 'PowerPartner') {
                            if (user.Profile.Name == "Rehab/Repair Vendor Profile") {
                                $rootScope.isVerifier = false;
                                $rootScope.user.isVerifier = false;
                                flag = true;
                                //console.log("PowerPartner User",user,$rootScope.isVerifier);
                            } else if (user.Profile.Name.includes('Verifier')) {
                                $rootScope.isVerifier = true;
                                $rootScope.user.isVerifier = true;
                                flag = true;
                            }
                        } else if (user.UserType == 'Standard') {
                            $rootScope.isVerifier = true;
                            $rootScope.user.isVerifier = true;
                        }

                    }

                });
                if (error) {
                    $scope.error = "Bad password or user name";
                }
            } else {
                $scope.error = "Bad password or user name";
            }
            //console.log(flag);
            if (flag) {
                var params = {
                    "userDetail": {
                        "userName": username,
                        "password": password
                    }
                };

                $http({
                        method: 'POST',
                        url: $rootScope.initServer + '/services/apexrest/User',   //Obtains session id from Salesforce apex class "HomereadyUsertype"
                        data: params
                    })
                    .success(function(data, status, headers, config) {
                        //console.log(data);
                        if (data) {
                            var newOption = {
                                instanceURL: $rootScope.initServer,
                                accessToken: data
                            };
                            force.init(newOption);
                            if (force.isAuthenticated()) {
                                localforage.setItem('User', $rootScope.user).then(function() {
                                    console.log("User Saved!");
                                }, function(error) {
                                    console.log(error);
                                });
                                saveLoginHistory();
                                $state.go('landing');
                            }
                        } else {
                            $scope.error = "Bad password or user name";
                        }
                    })
                    .error(function(error, status, headers, config) {
                        console.log(error);
                        $scope.error = "Bad password or user name";
                    });


            } else if (username && password && $rootScope.isOnline) {
                //console.log("Salesforce User",$rootScope.user,$rootScope.isVerifier);
                //console.log("Came here!");
                var myOption = {
                    instanceURL: option.loginURL,
                    loginURL: server
                }
                force.init(myOption);
                force.restLogin(username, password, server).then(
                    function(data) {

                        if (force.isAuthenticated()) {
                            localforage.setItem('User', $rootScope.user).then(function() {
                                console.log("User Saved!");
                            }, function(error) {
                                console.log(error);
                            });
                            $ionicNavBarDelegate.showBar(true);
                            $rootScope.menuToggle = false;
                            $rootScope.backButton = false;
                            saveLoginHistory();
                            $state.go('landing');
                            $scope.error = false;
                        } else {
                            $scope.error = "Bad password or user name";
                        }
                    },
                    function(error) {
                        $scope.error = "Bad password or user name";
                    });
            } else if (!$rootScope.isOnline || $cordovaNetwork.connection == 'none') {
                $scope.error = "You seem to be Offline!";
                localforage.getItem('User').then(function(data) {
                    if (data) {
                        $rootScope.user = data;
                        if (!$rootScope.user.isVerifier) {
                            $rootScope.isVerifier = false;
                        }
                        $rootScope.offlineMode = true;
                        console.log("User Found!");
                        $rootScope.isOnline = false;
                        $state.go('landing');
                    }
                }, function(error) {
                    console.log(error);
                });
            } else {
                $scope.error = "Bad password or user name";
            }
        });
        //console.log($rootScope.initServer);

    };

});
