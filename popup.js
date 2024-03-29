var app = angular.module('cors', ['ionic']);

app.controller('PopupCtrl', ['$scope', function ($scope) {
    $scope.active = false;
    $scope.url = '';
    $scope.labelOne = '';
    $scope.labelTwo = '';
    $scope.spreadSheet = '';

    chrome.storage.local.get({
        'active': false,
        'url': '',
        'labelOne': '',
        'labelTwo': '',
        'spreadSheet': ''
    }, function (result) {
        $scope.active = result.active;
        $scope.url = result.url;
        $scope.labelOne = result.labelOne;
        $scope.labelTwo = result.labelTwo;
        $scope.spreadSheet = result.spreadSheet;

        $scope.$apply();

        $scope.$watch('active', function (newValue, oldValue) {
            chrome.storage.local.set({'active': $scope.active});
            chrome.extension.getBackgroundPage().reload();
        });

        $scope.$watch('url', function (newValue, oldValue) {
            chrome.storage.local.set({'url': $scope.url});
            chrome.extension.getBackgroundPage().reload();
        });

        $scope.$watch('labelOne', function (newValue, oldValue) {
            chrome.storage.local.set({'labelOne': $scope.labelOne});
            chrome.extension.getBackgroundPage().reload();
        });

        $scope.$watch('labelTwo', function (newValue, oldValue) {
            chrome.storage.local.set({'labelTwo': $scope.labelTwo});
            chrome.extension.getBackgroundPage().reload();
        });
        $scope.$watch('spreadSheet', function (newValue, oldValue) {
            chrome.storage.local.set({'spreadSheet': $scope.spreadSheet});
            chrome.extension.getBackgroundPage().reload();
        });
    });
}]);