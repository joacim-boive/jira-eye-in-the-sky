var $sprints = null;
var sprints = {};
var isActive = 0;
var url = '';
var labelOne = '';
var labelOneCount = 0;
var labelTwo = '';
var labelTwoCount = 0;
var thisMessage = null;
var html = '';
var missingLabels = 0;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var result = request.result;

        isActive = +result.active;
        url = result.url;
        labelOne = result.labelOne;
        labelTwo = result.labelTwo;


        localStorage.setItem('isActive', isActive);
        localStorage.setItem('url', url);
        localStorage.setItem('labelOne', labelOne);
        localStorage.setItem('labelTwo', labelTwo);
    });

function init(){

//    // select the target node
//    var target = document.querySelector('#some-id');
//
//// create an observer instance
//    var observer = new MutationObserver(function(mutations) {
//        mutations.forEach(function(mutation) {
//            console.log(mutation.type);
//        });
//    });
//
//// configuration of the observer:
//    var config = { attributes: true, childList: true, characterData: true }
//
//// pass in the target node, as well as the observer options
//    observer.observe(target, config);


    $(document).ajaxStop(function () {
        var totalTimer = '';
        for (var sprintId in sprints) {
            totalTimer = '<span id="total' + sprintId + '" class="aui-badge" title="Total remaining hours, including sub-tasks">' + sprints[sprintId] + '</span>';
            $('div[data-sprint-id="' + sprintId + '"] div.ghx-badge-group.ghx-right').prepend(totalTimer);
        }

        thisMessage.innerHTML = html;
    });

    $sprints.each(function getListOfSprints(index, sprint) {
        sprints[sprint.dataset.sprintId] = 0;
        $.ajax({
                url: url + '/rest/api/2/search',
                type: 'GET',
                dataType: 'json',
                sprintId: sprint.dataset.sprintId,
                sprintName: sprint.childNodes[0].childNodes[1].innerText,
                data: {
                    'jql': 'sprint=' + sprint.dataset.sprintId + ' AND type != Sub-task'
                }
            })
            .done(function getIssuesInCurrentSprint(data) {
                var that = this;

                labelOneCount = 0;
                labelTwoCount = 0;
                missingLabels = 0;

                data.issues.forEach(function getEachIssue(issue) {
                    var labels = [];

                    var hoursForStory = 0;
                    var hoursActual = 0;
                    var hoursIncludingSubTasks = issue.fields.aggregatetimeestimate / 3600;
                    var key = issue.key;
                    var $timeHolder = $('div[data-issue-key="' + key + '"] span.ghx-statistic-badge');
                    var $totalTimer = $('#total' + that.sprintId);
                    var $totalTimeHolder = $('div[data-sprint-id="' + that.sprintId + '"] div.ghx-badge-group.ghx-right');
                    var listIssue = document.querySelector('a[title="' + issue.key + '"]');

                    if(listIssue){
                        for(var x = 0, labelLen = issue.fields.labels.length; x < labelLen; x++){
                            if(issue.fields.labels[x] === labelOne){
                                labelOneCount++;
                                labels.push(labelOne);
                            }
                            if(issue.fields.labels[x] === labelTwo){
                                labelTwoCount++;
                                labels.push(labelTwo);
                            }
                        }

                        if(labels.length === 0){
                            missingLabels++;
                            console.warn('Missing labels: ' + key);
                        }
                        $(listIssue).closest('.js-issue').attr('data-labels', labels.join(','));
                    }

                    hoursForStory = parseInt($timeHolder.text());
                    hoursActual = !hoursIncludingSubTasks ? hoursForStory : hoursIncludingSubTasks ? hoursIncludingSubTasks : 0;
                    hoursActual = hoursActual ? hoursActual : 0;
                    $timeHolder.text(hoursActual);
                    sprints[that.sprintId] += hoursActual;
                });

                html += '<ul><li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(that.sprintId + ' and type != sub-task') + '">' + that.sprintName + ' : ' + that.sprintId + '</a></li><ul>';
                html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(that.sprintId + ' and labels in(' + labelOne + ')') +'">' + labelOne + ': ' + labelOneCount + '</a>';
                html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(that.sprintId + ' and labels in(' + labelTwo + ')') +'">' + labelTwo + ': ' + labelTwoCount + '</a>';

                if(missingLabels > 0){
                    html+= '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(that.sprintId + ' and (labels not in(' + labelOne + ', ' + labelTwo + ') or labels is Empty) and type != sub-task') +'"><span class="hint--top hint--warning hint--bounce" aria-label="Click to show JIRAs that are missing the ' + labelOne + ' & ' + labelTwo + ' label(s)">Missing labels - ' + missingLabels + '</span></a>'
                }
                html += '</ul></ul>';


            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log('HTTP Request Failed');
            })
    });
}

function messageSystem(){
    var thisId = 'jira-eye-in-the-sky_message';

    function dragStart(event) {
        var style = window.getComputedStyle(event.target, null);
        event.dataTransfer.setData('text/plain',
            (parseInt(style.getPropertyValue('left'),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'),10) - event.clientY));
    }

    function dragOver(event) {
        event.preventDefault();
        return false;
    }

    function drop(event) {
        var offset = event.dataTransfer.getData('text/plain').split(',');
        var dm = document.getElementById(thisId);

        dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
        dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';

        event.preventDefault();
        return false;
    }

    $('body').append('<aside draggable="true" id="' + thisId + '">Loading...</aside>');

    thisMessage = document.getElementById(thisId);
    thisMessage.addEventListener('dragstart',dragStart,false);
    document.body.addEventListener('dragover',dragOver,false);
    document.body.addEventListener('drop',drop,false);
}

function launch(){
    if(isActive !== 1){
        isActive = parseInt(localStorage.getItem('isActive')) || 0;

        if(isActive !== 1){
           console.log('Disabled...');
           return;
       }else{
           url = localStorage.getItem('url');
           labelOne = localStorage.getItem('labelOne');
           labelTwo = localStorage.getItem('labelTwo');

           messageSystem();
       }
    }

    if(url === '' || window.location.href.indexOf(url) === -1){
        console.log('wrong url: ' + window.location.href);
        return;
    }

    if (!$('.ghx-sprint-group > div[data-sprint-id]').size()) {
        window.requestAnimationFrame(launch);
    }else{
        $sprints = $('.ghx-sprint-group > div[data-sprint-id]');
        init();
    }
}

launch();