var $sprints = null;
var sprints = [];
var isActive = 0;
var url = '';
var labelOne = '';
var labelTwo = '';
var thisMessage = null;
var thisMessageHolder = null;
var jiralyzer = null;

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
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

function init() {
    var thisSprint = {};

//    // select the target node
    var jiraView = document.getElementById('ghx-rabid');
//
//// create an observer instance
    var jiraViewObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            console.log(mutation.type);
        });
    });
//
//// configuration of the observer:
    var config = {attributes: true, childList: false, characterData: false};
//
//// pass in the target node, as well as the observer options
    jiraViewObserver.observe(jiraView, config);


    $(document).ajaxStop(function () {
        var totalTimer = '';
        var html = '';

        for (var sprintId in sprints) {
            totalTimer = '<span id="total' + sprintId + '" class="aui-badge" title="Total remaining hours, including sub-tasks">' + sprints[sprintId] + '</span>';
            $('div[data-sprint-id="' + sprintId + '"] div.ghx-badge-group.ghx-right').prepend(totalTimer);
        }

        sprints.sort(function (thisSprint, thatSprint) {
            if (thisSprint.sprintId > thatSprint.sprintId) {
                return 1;
            }
            if (thisSprint.value < thatSprint.value) {
                return -1;
            }
        });

        sprints.forEach(function (sprint, index) {
            html += sprint.html;
        });

        thisMessageHolder.innerHTML = html;
    });

    $sprints.each(function getListOfSprints(index, sprint) {
        thisSprint = {};
        thisSprint.sprintId = sprint.dataset.sprintId;
        thisSprint.sprintName = sprint.childNodes[0].childNodes[1].innerText;
        thisSprint.totalHours = 0;
        thisSprint.missingLabels = 0;
        thisSprint.html = '';

        thisSprint[labelOne] = {};
        thisSprint[labelOne].count = 0;
        thisSprint[labelOne].hours = 0;

        thisSprint[labelTwo] = {};
        thisSprint[labelTwo].count = 0;
        thisSprint[labelTwo].hours = 0;

        $.ajax({
                url: url + '/rest/api/2/search',
                type: 'GET',
                dataType: 'json',
                thatSprint: thisSprint,
                data: {
                    'jql': 'sprint=' + thisSprint.sprintId + ' AND type != Sub-task'
                }
            })
            .done(function getIssuesInCurrentSprint(data) {
                var that = this;
                var thatSprint = that.thatSprint;
                var html = '';
                var labels = [];
                var hoursForStory = 0;
                var hoursActual = 0;
                var hoursIncludingSubTasks = 0;
                var key = '';
                var $timeHolder = null;
                var listIssue = null;

                data.issues.forEach(function getEachIssue(issue) {
                    labels = [];
                    hoursIncludingSubTasks = issue.fields.aggregatetimeestimate / 3600;
                    key = issue.key;
                    $timeHolder = $('div[data-issue-key="' + key + '"] span.ghx-statistic-badge');
                    listIssue = document.querySelector('a[title="' + issue.key + '"]');

                    hoursForStory = parseInt($timeHolder.text());
                    hoursActual = !hoursIncludingSubTasks ? hoursForStory : hoursIncludingSubTasks ? hoursIncludingSubTasks : 0;
                    hoursActual = hoursActual ? hoursActual : 0;
                    $timeHolder.text(hoursActual);

                    thatSprint.totalHours += hoursActual;


                    if (listIssue) {
                        for (var x = 0, labelLen = issue.fields.labels.length; x < labelLen; x++) {
                            /**
                             * NOTE: This will count the same hours "twice" if the issue has both labelOne and labelTwo.
                             */
                            if (issue.fields.labels[x] === labelOne) {
                                thatSprint[labelOne].count++;
                                thatSprint[labelOne].hours += hoursActual;

                                labels.push(labelOne);
                            }
                            if (issue.fields.labels[x] === labelTwo) {
                                thatSprint[labelTwo].count++;
                                thatSprint[labelTwo].hours += hoursActual;

                                labels.push(labelTwo);
                            }
                        }

                        if (labels.length === 0) {
                            thatSprint.missingLabels++;
                            console.warn('Missing labels: ' + key);
                        }

                        $(listIssue).closest('.js-issue').attr('data-labels', labels.join(','));
                    }
                });


                html += '<ul><li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and type != sub-task') + '">' + thatSprint.sprintName + ' : ' + thatSprint.sprintId + '</a></li><ul>';
                html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and labels in(' + labelOne + ')') + '">' + labelOne + ': ' + thatSprint[labelOne].count + ' / ' + thatSprint[labelOne].hours + 'h</a>';
                html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and labels in(' + labelTwo + ')') + '">' + labelTwo + ': ' + thatSprint[labelTwo].count + ' / ' + thatSprint[labelTwo].hours + 'h</a>';

                if (thatSprint.missingLabels > 0) {
                    html += '<li><a target="_blank" href="' + url + '/issues/?jql=sprint=' + encodeURIComponent(thatSprint.sprintId + ' and (labels not in(' + labelOne + ', ' + labelTwo + ') or labels is Empty) and type != sub-task') + '"><span class="hint--top hint--warning hint--bounce" aria-label="Click to show JIRAs that are missing the ' + labelOne + ' & ' + labelTwo + ' label(s)">Missing labels - ' + thatSprint.missingLabels + '</span></a>'
                }
                html += '</ul></ul>';

                thatSprint.html = html;

                sprints.push(thatSprint);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                console.log('HTTP Request Failed');
            })

    });
}

function messageSystem() {
    var thisId = 'jiralyzer';

    function dragStart(event) {
        var style = window.getComputedStyle(event.target, null);
        event.dataTransfer.setData('text/plain',
            (parseInt(style.getPropertyValue('left'), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue('top'), 10) - event.clientY));
    }

    function dragOver(event) {
        event.preventDefault();
        return false;
    }

    function drop(event) {
        var offset = event.dataTransfer.getData('text/plain').split(',');
        var dm = document.getElementById(thisId);

        dm.style.left = (event.clientX + parseInt(offset[0], 10)) + 'px';
        dm.style.top = (event.clientY + parseInt(offset[1], 10)) + 'px';

        event.preventDefault();
        return false;
    }

    $('body').append('<aside draggable="true" id="' + thisId + '"><h1><div class="collapser"></div>JIRALyzer - Planning</h1><div class="jl-content"><p>Loading...</p></div></aside>');

    jiralyzer = $('#' + thisId);

    thisMessage = document.getElementById(thisId);
    thisMessageHolder = thisMessage.querySelector('.jl-content');

    thisMessage.addEventListener('dragstart', dragStart, false);
    document.body.addEventListener('dragover', dragOver, false);
    document.body.addEventListener('drop', drop, false);
}

function eventHandlers() {
    jiralyzer.find('h1').on('click', function () {
        jiralyzer.toggleClass('collapsed');
    });
}

function launch() {
    if (window.location.search.toLowerCase().indexOf('&view=planning') === -1) {
        console.info('JIRALyser: Wrong view, needs to be in /secure/RapidBoard.jspa & the planning view');

        try {
            jiralyzer.hide();
        } catch (e) {

        }

        return;
    }

    if (isActive !== 1) {
        isActive = parseInt(localStorage.getItem('isActive')) || 0;

        if (isActive !== 1) {
            console.info('JIRALyser: is disabled in the extension');
            return;
        } else {
            url = localStorage.getItem('url');
            labelOne = localStorage.getItem('labelOne');
            labelTwo = localStorage.getItem('labelTwo');

            messageSystem();
            eventHandlers();
        }
    }

    if (url === '' || window.location.href.indexOf(url) === -1) {
        console.log('wrong url: ' + window.location.href);
        return;
    }

    if (!$('.ghx-sprint-group > div[data-sprint-id]').size()) {
        window.requestAnimationFrame(launch);
    } else {
        (function (history) {
            var pushState = history.pushState;
            history.pushState = function (state) {
                if (typeof history.onpushstate == "function") {
                    history.onpushstate({state: state});
                }
                debugger;
                // whatever else you want to do
                // maybe call onhashchange e.handler
                return pushState.apply(history, arguments);
            }
        })(window.history);

        $sprints = $('.ghx-sprint-group > div[data-sprint-id]');
        eventHandlers();
        init();
    }
}

launch();