ons.bootstrap();
var module = angular.module("exchangeApp", ["onsen"]);

NCMB.initialize("APPLICATION KEY", "CLIENT KEY");

function toBlob(base64) {
    var bin = atob(base64.replace(/^.*,/, ""));
    var buffer = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
    }
    try {
        var blob = new Blob([buffer.buffer], {
            type: "image/jpeg"
        });
    } catch (e) {
        return false;
    }
    return blob;
}

/*
    Variables in $rootScope:
        selectedItem
        selectedUser
        selectedRequest
        myfavouritelist
*/

module.controller("PortalController", function(userInfo, $scope) {
    $scope.login = function(userNameLogin, passwordLogin) {
        NCMB.User.logIn(userNameLogin, passwordLogin, {
            success: function(user) {
                userInfo.refresh();
                myNavigator.pushPage("mainPage.html");
            },
            error: function(user, error) {
                ons.notification.alert({
                    message: error.message,
                    title: "ログイン失敗",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    // SessionToken Check
    if (userInfo.userName != null) {
        var currentUser = NCMB.User.current();
        currentUser.fetch({
            success: function(myObject) {
                myNavigator.pushPage("mainPage.html");
            },
            error: function(myObject, error) {
                if (error.code == "E401001") {
                    // Don't push to mainPage.html
                    NCMB.User.logOut();
                }
            }
        });
    }
    
    // For Test (Monaca IOS Debugger is crashed! I can't type there because the keyboard can't run!)
    $scope.userNameLogin = "a";
    $scope.passwordLogin = "a";
});

module.controller("RegisterController", function($scope) {
    $scope.register = function(userNameSignUp, passwordSignUp, passwordSignUpRetype) {   
        if (passwordSignUp !== passwordSignUpRetype) {
            ons.notification.alert({
                message: "パスワードが一致しません。もう一度入力してください。",
                title: "登録失敗",
                buttonLabel: "OK",
                animation: "default"
            });
            return;
        }
        
        var user = new NCMB.User();    
        user.set("userName", userNameSignUp);
        user.set("password", passwordSignUp);
        user.setACL(new NCMB.ACL({"*":{"read":true}}));
        user.signUp(null, {
            success: function (){
                ons.notification.alert({
                    message: "ユーザー名：" + userNameSignUp,
                    title: "登録成功",
                    buttonLabel: "OK",
                    animation: "default",
                    callback: function() {
                        myNavigator.popPage();
                    }
                });
            },
            error: function (obj, error){
                ons.notification.alert({
                    message: error.message,
                    title: "登録失敗",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
});

module.controller("MainPageController", function($scope) {
    /*
    $scope.addPageInitMyListEventListener = function() {
        document.addEventListener("pageinit", function(e) {
            if (e.target.id == "myList") {}
        }, false);
    };
    $scope.addPageInitMyListEventListener();
    */
});

module.controller("ItemListController", function(userInfo, $rootScope, $scope) {
   $scope.showNewItemDetail = function(index) {
        $rootScope.selectedItem = $scope.newItemList[index];
        myNavigator.pushPage("itemDetail.html");
    };
    
    $scope.showSearchedItemDetail = function(index) {
        $rootScope.selectedItem = $scope.searchedItemList[index];
        myNavigator.pushPage("itemDetail.html");
    };
    
    $scope.onLoadNewItemList = function() {
        var Item = NCMB.Object.extend("Item");
        var itemQuery = new NCMB.Query(Item);
        itemQuery.descending("createDate");
        itemQuery.limit(5);
        itemQuery.notEqualTo("owner", userInfo.userName);
        itemQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var item = {};
                        item.itemTitle = results[i].get("itemTitle");
                        item.owner = results[i].get("owner");
                        item.itemDesc = results[i].get("itemDesc");
                        item.photo = results[i].get("photoFileName");
                        item.objectId = results[i].id;
                        data.newItemList[i] = item;
                    }
                }
                
                function getPhotoData(fileName, index) {
                    var objFile = new NCMB.File(fileName, null, null, null);
                    objFile.fetch().then(function(){
                        $scope.$apply(function() {
                            data.newItemList[index].photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());
                        });
                    });
                }
                
                var data = {};
                data.newItemList = [];
                insertJSONObject(data, results);
                for (var i = 0; i < results.length; i++) {
                    getPhotoData(data.newItemList[i].photo, i);
                }
                $scope.newItemList = data.newItemList;
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.ItemSearch = function(itemTitleSearch) {
        var Item = NCMB.Object.extend("Item");
        var itemSearchQuery = new NCMB.Query(Item);
        itemSearchQuery.equalTo("itemTitle", itemTitleSearch);
        itemSearchQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var item = {};
                        item.itemTitle = results[i].get("itemTitle");
                        item.owner = results[i].get("owner");
                        item.itemDesc = results[i].get("itemDesc");
                        item.photo = results[i].get("photoFileName");
                        data.searchedItemList[i] = item;
                    }
                }
                
                function getPhotoData(fileName, index) {
                    var objFile = new NCMB.File(fileName, null, null, null);
                    objFile.fetch().then(function(){
                        $scope.$apply(function() {
                            data.searchedItemList[index].photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());
                        });
                    });
                }
                
                var data = {};
                data.searchedItemList = [];
                insertJSONObject(data, results);
                for (var i = 0; i < results.length; i++) {
                    getPhotoData(data.searchedItemList[i].photo, i);
                }
                $scope.$apply(function() {
                    $scope.searchedItemList = data.searchedItemList;
                    $scope.isLoading = 0;    
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.itemTitleSearch = "";
    $scope.onLoadNewItemList();
});


module.controller("ItemDetailController", function(userInfo, $rootScope, $scope) {
    $scope.currentUserName = userInfo.userName;
});

module.controller("UserListController", function(userInfo, $rootScope, $scope) {
    $scope.onLoadNewUserList = function() {
        var User = NCMB.Object.extend("user");
        var newUserQuery = new NCMB.Query(User);
        newUserQuery.notEqualTo("userName", userInfo.userName);
        newUserQuery.descending("createDate");
        newUserQuery.limit(5);
        newUserQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var newUser = {};
                        newUser.userName = results[i].get("userName");
                        data.newUserList[i] = newUser;
                    }
                }

                var data = {};
                data.newUserList = [];
                insertJSONObject(data, results);
                $scope.$apply(function() {
                    $scope.newUserList = data.newUserList;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.onLoadFavoriteList = function() {        
        var Favorite = NCMB.Object.extend("Favorite");
        var favoriteQuery = new NCMB.Query(Favorite);
        favoriteQuery.equalTo("from", userInfo.userName);
        favoriteQuery.descending("createDate");
        favoriteQuery.find({
            success: function (results) {
                function insertStringValue(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var to = results[i].get("to");
                        data.myFavoriteUserList[i] = {};
                        data.myFavoriteUserList[i].objectId = results[i].id;
                        data.myFavoriteUserList[i].userName = to;
                    }
                }
                
                var data = {};
                data.myFavoriteUserList = [];
                insertStringValue(data, results);
                $scope.$apply(function() {
                    $rootScope.myFavoriteUserList = data.myFavoriteUserList;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.UserSearch = function(userNameSearch) {
        var User = NCMB.Object.extend("user");
        var userSearchQuery = new NCMB.Query(User);
        userSearchQuery.equalTo("userName", userNameSearch);
        userSearchQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var searchedUser = {};
                        searchedUser.userName = results[i].get("userName");
                        data.searchedUserList[i] = searchedUser;
                    }
                }
                
                var data = {};
                data.searchedUserList = [];
                insertJSONObject(data, results);
                $scope.$apply(function() {
                    $scope.searchedUserList = data.searchedUserList;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.showNewUserDetail = function(index) {
        $rootScope.selectedUser = $scope.newUserList[index];
        myNavigator.pushPage("userDetail.html");
    };
    
    $scope.showSearchedUserDetail = function(index) {
        $rootScope.selectedUser = $scope.searchedUserList[index];
        myNavigator.pushPage("userDetail.html");
    };
    
    $scope.showFavorUserDetail = function(index) {
        $rootScope.selectedUser = {"userName" : $rootScope.myFavoriteUserList[index].userName};
        myNavigator.pushPage("userDetail.html");
    };
    
    $scope.userNameSearch = "";
    $scope.onLoadNewUserList();
    $scope.onLoadFavoriteList();
});

module.controller("UserDetailController", function(userInfo, $rootScope, $scope) {
    $scope.onLoadUserItemList = function() {
        $scope.userItemList = [];
        $scope.isLoading = 1;
        
        var Item = NCMB.Object.extend("Item");
        var itemQuery = new NCMB.Query(Item);
        itemQuery.descending("createDate");
        itemQuery.equalTo("owner", $rootScope.selectedUser.userName);
        itemQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var item = {};
                        item.itemTitle = results[i].get("itemTitle");
                        item.owner = results[i].get("owner");
                        item.itemDesc = results[i].get("itemDesc");
                        item.photo = results[i].get("photoFileName");
                        item.objectId = results[i].id;
                        data.userItemList[i] = item;
                    }
                }
                
                function getPhotoData(fileName, index) {
                    var objFile = new NCMB.File(fileName, null, null, null);
                    objFile.fetch().then(function(){
                        $scope.$apply(function() {
                            data.userItemList[index].photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());    
                        });
                    });
                }
                
                var data = {};
                data.userItemList = [];
                insertJSONObject(data, results);
                for (var i = 0; i < results.length; i++) {
                    getPhotoData(data.userItemList[i].photo, i);
                }
                
                $scope.$apply(function() {
                    $scope.userItemList = data.userItemList;
                    $scope.isLoading = 0;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.showUserItemDetail = function(index) {
        $rootScope.selectedItem = $scope.userItemList[index];
        myNavigator.pushPage("itemDetail.html");
    };
    
    $scope.onLoadFavorButton = function() {
        $scope.currentUserName = userInfo.userName;
        for (var k = 0; k < $rootScope.myFavoriteUserList.length; k++) {
            if ($rootScope.myFavoriteUserList[k].userName == $rootScope.selectedUser.userName) {
                $rootScope.selectedUser.isFavor = 1;
                break;
            }
        }
    };
        
    $scope.addFavorite = function() {
        var Favorite = NCMB.Object.extend("Favorite");
        var favorite = new Favorite();
        favorite.set("from", userInfo.userName);
        favorite.set("to", $rootScope.selectedUser.userName);
        
        favorite.save(null, {
            success: function (){
                $scope.$apply(function() {
                    var newfavoriteuser = {};
                    newfavoriteuser.userName = $rootScope.selectedUser.userName;
                    newfavoriteuser.objectId = favorite.id;
                    $rootScope.myFavoriteUserList.splice(0, 0, newfavoriteuser);
                    $rootScope.selectedUser.isFavor = 1;
                });
                
                ons.notification.alert({
                    message: "成功しました！",
                    title: "お気に入り追加",
                    buttonLabel: "OK",
                    animation: "default"
                });
            },
            error: function (obj, error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.deleteFavorite = function() {
        var favoriteObjectId = null;
        var k = 0;
        for (; k < $rootScope.myFavoriteUserList.length; k++) {
            if ($rootScope.myFavoriteUserList[k].userName == $rootScope.selectedUser.userName) {
                favoriteObjectId = $rootScope.myFavoriteUserList[k].objectId;
                break;
            }
        }
        $rootScope.myFavoriteUserList.splice(k, 1);

        NCMB._request("classes", "Favorite", favoriteObjectId, 'DELETE');
        $rootScope.selectedUser.isFavor = 0;
        $scope.$apply();
        
        ons.notification.alert({
            message: "削除しました。",
            title: "お気に入り削除",
            buttonLabel: "OK",
            animation: "default"
        });
    };
    
    $scope.onLoadUserItemList();
    $scope.onLoadFavorButton();
});

module.controller("MyListController", function(userInfo, $rootScope, $scope) {
    $scope.onLoadMyItemList = function() {
        $scope.myItemList = [];
        $scope.isLoading = 1;
        
        var Item = NCMB.Object.extend("Item");
        var itemQuery = new NCMB.Query(Item);
        itemQuery.descending("createDate");
        itemQuery.equalTo("owner", userInfo.userName);
        itemQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var item = {};
                        item.itemTitle = results[i].get("itemTitle");
                        item.owner = results[i].get("owner");
                        item.itemDesc = results[i].get("itemDesc");
                        item.photo = results[i].get("photoFileName");
                        item.objectId = results[i].id;
                        data.myItemList[i] = item;
                    }
                }
                
                function getPhotoData(fileName, index) {
                    var objFile = new NCMB.File(fileName, null, null, null);
                    objFile.fetch().then(function(){
                        $scope.$apply(function() {
                            data.myItemList[index].photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());    
                        });
                    });
                }
                
                var data = {};
                data.myItemList = [];
                insertJSONObject(data, results);
                for (var i = 0; i < results.length; i++) {
                    getPhotoData(data.myItemList[i].photo, i);
                }
                
                $scope.$apply(function() {
                    $scope.myItemList = data.myItemList;
                    $scope.isLoading = 0;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.onLoadMyRequestList = function() {
        var Request = NCMB.Object.extend("Request");
        var requestQuery = new NCMB.Query(Request);
        var requestQuery_1 = new NCMB.Query(Request);
        var requestQuery_2 = new NCMB.Query(Request);
        
        requestQuery = new NCMB.Query.or(
            requestQuery_1.equalTo("fromOwner", userInfo.userName), 
            requestQuery_2.equalTo("toOwner", userInfo.userName));
        requestQuery.descending("createDate");
        requestQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var request = {};
                        request.fromOwner = results[i].get("fromOwner");
                        request.toOwner = results[i].get("toOwner");
                        request.fromItemIdList = results[i].get("fromItemIdList");
                        request.toItemId = results[i].get("toItemId");
                        request.toOwnerStatus = results[i].get("toOwnerStatus");
                        request.updateDate = results[i].get("updateDate");
                        request.objectId = results[i].id;
                        data.requests[i] = request;
                    }
                }
                
                var data = {};
                data.requests = [];
                insertJSONObject(data, results);
                $scope.$apply(function() {
                    $scope.requests = data.requests;    
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.showMyItemDetail = function(index) {
        $rootScope.selectedItem = $scope.myItemList[index];
        myNavigator.pushPage("itemDetail.html");
    };
    
    $scope.showMyRequestDetail = function(index) {
        $rootScope.selectedRequest = $scope.requests[index];
        myNavigator.pushPage("requestDetail.html");
    };
    
    if ($rootScope.myListNavi != "1" && $rootScope.myListNavi != "2") {
        $rootScope.myListNavi = "1";
    }
    $scope.onLoadMyItemList();
    $scope.onLoadMyRequestList();
});

module.controller("AddItemController", function(userInfo, $scope) {
    $scope.addNewItem = function() {
        if ($scope.itemTitleAdd == "" || $scope.itemDescAdd == "") {
            ons.notification.alert({
                message: "中古品情報を入力してください。",
                title: "Error",
                buttonLabel: "OK",
                animation: "default"
            });
            return;
        }
        
        var Item = NCMB.Object.extend("Item");
        var item = new Item();
        item.set("itemTitle", $scope.itemTitleAdd);
        item.set("itemDesc", $scope.itemDescAdd);
        item.set("owner", $scope.currentUserName);
        
        if ($scope.addItemPhotoCache != null) {
            var photoFileName = Date.now() + "_" + userInfo.userName + ".jpg";
            var ncmbFile = new NCMB.File(photoFileName, toBlob($scope.addItemPhotoCache));
            item.set("photoFileName", photoFileName);
            ncmbFile.save().then(function(object) {
                ons.notification.alert({
                    message: "写真を保存しました！",
                    title: "中古品追加",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }, function(error) {
                item.set("photoFileName", null);
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            });

            $scope.addItemPhotoCache = null;
        }
        
        item.save(null, {
            success: function (){
                ons.notification.alert({
                    message: "追加に成功しました！",
                    title: "中古品追加",
                    buttonLabel: "OK",
                    animation: "default",
                    callback: function() {
                        myNavigator.popPage();
                        tabbar.setActiveTab(2);
                    }
                });
            },
            error: function (obj, error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.takePhoto = function() {
        navigator.camera.getPicture (onSuccess, onFail, 
            { quality : 100, 
              destinationType : Camera.DestinationType.DATA_URL, 
              sourceType : Camera.PictureSourceType.CAMERA, 
              encodingType: Camera.EncodingType.JPEG,
              targetWidth: 120,
              targetHeight: 150,
              popoverOptions: CameraPopoverOptions,
              saveToPhotoAlbum: false });

        function onSuccess (imageData) {
            $scope.addItemPhotoCache = imageData;
            document.getElementById("photoPreview").src = "data:image/jpeg;base64," + $scope.addItemPhotoCache;
        }

        function onFail (message) {
            ons.notification.alert({
                message: message,
                title: "Error",
                buttonLabel: "OK",
                animation: "default"
            });
        }
    };
    
    $scope.cancelAddItem = function() {
        // NCMB._request("files", $scope.photoFileName, null, "DELETE");
        $scope.addItemPhotoCache = null;
        myNavigator.popPage();
    }

    $scope.currentUserName = userInfo.userName;
    
    // For Test (Monaca IOS Debugger is crashed! I can't type there because the keyboard can't run!)
    $scope.itemTitleAdd = "Test";
    $scope.itemDescAdd = "テスト";
});

module.controller("RequestDetailController", function(userInfo, $rootScope, $scope) {
    $scope.onLoadRequestDetail = function(index) {
        var Item = NCMB.Object.extend("Item");
        var itemQuery = new NCMB.Query(Item);
        itemQuery.equalTo("objectId", $rootScope.selectedRequest.toItemId);
        itemQuery.find({
            success: function (results) {
                $rootScope.selectedRequest.toItem = {};
                $rootScope.selectedRequest.toItem.itemTitle = results[0].get("itemTitle");
                $rootScope.selectedRequest.toItem.owner = results[0].get("owner");
                $rootScope.selectedRequest.toItem.itemDesc = results[0].get("itemDesc");
                $rootScope.selectedRequest.toItem.photo = results[0].get("photoFileName");
                $rootScope.selectedRequest.toItem.objectId = results[0].id;
                                
                var objFile = new NCMB.File($rootScope.selectedRequest.toItem.photo, null, null, null);
                objFile.fetch().then(function(){
                    $scope.$apply(function() {
                        $rootScope.selectedRequest.toItem.photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());    
                    });
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
        
        $rootScope.selectedRequest.fromItemList = [];
        for (var i = 0; i != $rootScope.selectedRequest.fromItemIdList.length; i++) {
            itemQuery = new NCMB.Query(Item);
            itemQuery.equalTo("objectId", $rootScope.selectedRequest.fromItemIdList[i]);
            itemQuery.find({
                success: function (results) {
                    var iteratorId = $rootScope.selectedRequest.fromItemList.length;
                    $rootScope.selectedRequest.fromItemList[iteratorId] = {};
                    $rootScope.selectedRequest.fromItemList[iteratorId].itemTitle = results[0].get("itemTitle");
                    $rootScope.selectedRequest.fromItemList[iteratorId].owner = results[0].get("owner");
                    $rootScope.selectedRequest.fromItemList[iteratorId].itemDesc = results[0].get("itemDesc");
                    $rootScope.selectedRequest.fromItemList[iteratorId].photo = results[0].get("photoFileName");
                    $rootScope.selectedRequest.fromItemList[iteratorId].objectId = results[0].id;

                    var objFile = new NCMB.File($rootScope.selectedRequest.fromItemList[iteratorId].photo, null, null, null);
                    objFile.fetch().then(function(){
                        $scope.$apply(function() {
                            $rootScope.selectedRequest.fromItemList[iteratorId].photo = "data:image/jpeg;base64," + window.btoa(objFile.getData());    
                        });
                    });
                },
                error: function (error){
                    ons.notification.alert({
                        message: error.message,
                        title: "Error",
                        buttonLabel: "OK",
                        animation: "default"
                    });
                }
            });    
        }
    };
    
    $scope.commitRequest = function() {
        $scope.updateRequest(1, "承諾しました！", "予約承諾");
    };
    
    $scope.refuseRequest = function() {
        $scope.updateRequest(-1, "断りしました。", "予約拒否"); 
    };
    
    $scope.updateRequest = function(_value, _message, _title) {
        var Request = NCMB.Object.extend("Request");
        var requestQuery = new NCMB.Query(Request);
        requestQuery.equalTo("objectId", $rootScope.selectedRequest.objectId);
        requestQuery.find({
            success: function (results) {
                results[0].set("toOwnerStatus", _value);
                results[0].save(null, {
                    success: function (){
                        ons.notification.alert({
                            message: _message,
                            title: _title,
                            buttonLabel: "OK",
                            animation: "default",
                            callback: function() {
                                myNavigator.popPage();
                                tabbar.setActiveTab(2);
                                $rootScope.myListNavi = "2";
                            }
                        });
                    },
                    error: function (obj, error){
                        ons.notification.alert({
                            message: error.message,
                            title: "Error",
                            buttonLabel: "OK",
                            animation: "default"
                        });
                    }
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.cancelRequest = function() {
        ons.notification.confirm({
            title: "予約削除",
            message: "本当にいいのでしょうか？",
            callback: function(idx) {
                switch(idx) {
                    case 0:
                        break;
                    case 1:
                        NCMB._request("classes", "Request", $rootScope.selectedRequest.objectId, 'DELETE');
                        ons.notification.alert({
                            message: "削除しました。",
                            title: "予約削除",
                            buttonLabel: "OK",
                            animation: "default",
                            callback: function() {
                                myNavigator.popPage();
                                tabbar.setActiveTab(2);
                                $rootScope.myListNavi = "2"; 
                            }
                        });
                        break;
                }
            }
        });
    }
    
    $scope.onLoadRequestDetail();
    $scope.currentUserName = userInfo.userName;
});

module.controller("AddRequestController", function(userInfo, $rootScope, $scope) {
    $scope.onLoadMyListItemTitle = function () {
        var Item = NCMB.Object.extend("Item");
        var itemQuery = new NCMB.Query(Item);
        itemQuery.equalTo("owner", userInfo.userName);
        itemQuery.select(['itemTitle']);
        itemQuery.find({
            success: function (results) {
                function insertJSONObject(data, results) {
                    for (var i = 0; i < results.length; i++) {
                        var item = {};
                        item.itemTitle = results[i].get("itemTitle");
                        item.objectId = results[i].id;
                        data.myItemList[i] = item;
                    }
                }
                
                var data = {};
                data.myItemList = [];
                insertJSONObject(data, results);
                $scope.$apply(function() {
                    $scope.myItemList = data.myItemList;
                });
            },
            error: function (error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    }
    
    $scope.addRequest = function () {
        var fromItemIdList = [];
        angular.forEach($scope.myItemList, function(myItem, arrayIndex){
            if(myItem.isChecked == true) {
                fromItemIdList.push(myItem.objectId);
            }
        })
        
        var Request = NCMB.Object.extend("Request");
        var request = new Request();
        request.set("fromOwner", userInfo.userName);
        request.set("toOwner", $rootScope.selectedItem.owner);
        request.set("fromItemIdList", fromItemIdList);
        request.set("toItemId", $rootScope.selectedItem.objectId);
        request.set("toOwnerStatus", 0);
        
        request.save(null, {
            success: function (){
                ons.notification.alert({
                    message: "成功しました！",
                    title: "予約追加",
                    buttonLabel: "OK",
                    animation: "default",
                    callback: function() {
                        myNavigator.popPage();
                    }
                });
            },
            error: function (obj, error){
                ons.notification.alert({
                    message: error.message,
                    title: "Error",
                    buttonLabel: "OK",
                    animation: "default"
                });
            }
        });
    };
    
    $scope.onLoadMyListItemTitle();
});

module.controller("SettingController", function($scope) {
    $scope.logout = function() {
        NCMB.User.logOut();
        myNavigator.popPage();
    };
});

module.service("userInfo", function() {
    var userInfo = {};
    userInfo.refresh = function () {
        if (!NCMB.User.current() || !(userInfo.userName = NCMB.User.current().get("userName"))) {
            userInfo.userName = null;
        }
    };
    userInfo.refresh();
    return userInfo;
});