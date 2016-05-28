var $sprints = null;
var sprints = {};
var isActive = false;
var url = '';
var labelOne = '';
var labelTwo = '';

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var result = request.result;

        isActive = result.active;
        url = result.url;
        labelOne = result.labelOne;
        labelTwo = result.labelTwo;

        localStorage.setItem('isActive', isActive);
        localStorage.setItem('url', url);
        localStorage.setItem('labelOne', labelOne);
        localStorage.setItem('labelTwo', labelTwo);
    });

function init(){

    // select the target node
    var target = document.querySelector('#some-id');

// create an observer instance
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            console.log(mutation.type);
        });
    });

// configuration of the observer:
    var config = { attributes: true, childList: true, characterData: true }

// pass in the target node, as well as the observer options
    observer.observe(target, config);


    $(document).ajaxStop(function () {
        var totalTimer = '';
        for (var sprintId in sprints) {
            totalTimer = '<span id="total' + sprintId + '" class="aui-badge" title="Total remaining hours, including sub-tasks">' + sprints[sprintId] + '</span>';
            $('div[data-sprint-id="' + sprintId + '"] div.ghx-badge-group.ghx-right').prepend(totalTimer);
        }
    });

    $sprints.each(function getListOfSprints(index, sprint) {
        sprints[sprint.dataset.sprintId] = 0;
        $.ajax({
                url: 'http://jira.lenslogistics.int/rest/api/2/search',
                type: 'GET',
                dataType: 'json',
                sprintId: sprint.dataset.sprintId,
                data: {
                    'jql': 'sprint=' + sprint.dataset.sprintId + ' AND type != Sub-task'
                }
            })
            .done(function getIssuesInCurrentSprint(data) {
                var that = this;

                data.issues.forEach(function getEachIssue(issue) {
                    var hoursForStory = 0;
                    var hoursActual = 0;
                    var hoursIncludingSubTasks = issue.fields.aggregatetimeestimate / 3600;
                    var key = issue.key;
                    var $timeHolder = $('div[data-issue-key="' + key + '"] span.ghx-statistic-badge');
                    var $totalTimer = $('#total' + that.sprintId);
                    var $totalTimeHolder = $('div[data-sprint-id="' + that.sprintId + '"] div.ghx-badge-group.ghx-right');
                    var listIssue = document.querySelector('a[title="' + issue.key + '"]');

                    if(listIssue){
                        listIssue.setAttribute('data-labels', issue.fields.labels.join(','));
                    }

                    hoursForStory = parseInt($timeHolder.text());
                    hoursActual = !hoursIncludingSubTasks ? hoursForStory : hoursIncludingSubTasks ? hoursIncludingSubTasks : 0;
                    hoursActual = hoursActual ? hoursActual : 0;
                    $timeHolder.text(hoursActual);
                    sprints[that.sprintId] += hoursActual;
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log('HTTP Request Failed');
            })
    });
}


function launch(){
    if(!isActive){
        isActive = localStorage.getItem('isActive');

       if(!isActive){
           console.log('Disabled...');
           return;
       }else{
           url = localStorage.getItem('url');
           labelOne = localStorage.getItem('labelOne');
           labelTwo = localStorage.getItem('labelTwo');
       }
    }

    if(url === '' || window.location.href.indexOf(url) === -1){
        console.log('wrong url: ' + window.location.href);
        return;
    }

    if (!$('.ghx-sprint-group > div[data-sprint-id]').size()) {
        window.requestAnimationFrame(launch);
    }else{
        debugger;
        $sprints = $('.ghx-sprint-group > div[data-sprint-id]');
        init();
    }
}

launch();