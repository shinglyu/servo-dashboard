var h = React.createElement;
var Issue =  React.createClass({
  handleClick: function() {
    window.location = this.props.issueinfo.html_url;
  },
  render: function(){
    var info = this.props.issueinfo;
    var org = undefined;
    /*
    if (info.owner.type == "Organization"){
      org = h('a', {href:info.owner.html_url}, info.owner.login)
    } */


    var description = info.description;
    var maxLength = 70;
    if (description != null && description.length > maxLength) {
      description = description.slice(0, maxLength) + "......"
    }

    var isPull = "Issue "
    if (info.hasOwnProperty('pull_request')) {
      isPull = "PR "
    }

    return (
      h('div', {
          className:"mui-panel mui-row repo-card", 
          onClick:this.handleClick, 
          title: info.body
        }, 
        h('a', {href: info.repository_url.replace('api.github.com/repos/', 'github.com/'), 
                className:"repo mui-col-md-1 mui-col-xs-6"
               }, 
               info.repository_url.replace('https://api.github.com/repos/', '')),
        h('a', {href: info.html_url, className:"number mui-col-md-2 mui-col-xs-6"}, isPull + "#" + info.number),
        h('a', {href: info.html_url, className:"title mui-col-md-5 mui-col-xs-12"}, info.title),
        h('a', {href:info.user.html_url, className:"mui-col-md-1 mui-col-xs-4"}, info.user.login),
        //h('p', {className:"body"}, info.body),
        h('span', {className:"updated_time mui-col-md-3 mui-col-xs-8 col-time"}, new Date(info.updated_at).toLocaleString())
      )
    )
  }
})

var IssueList =  React.createClass({
  render: function(){
    var lis = this.props.issues.map(function(issueinfo, idx){
      return h(Issue, { key:idx, issueinfo: issueinfo} )
    })
    return (
      h('div', {className:"mui-row"}, 
        h('div', {className:"mui-col-md-12"}, 
          lis
        )
      )
    )
  }
})

function compareByUpdatedTimeDesc(x, y){
  xd = Date.parse(x['updated_at'])
  yd = Date.parse(y['updated_at'])
  if (xd < yd) {
    return 1;
  }
  else if (xd > yd){
    return -1;
  }
  else {
    return 0;
  }
}

var Dashboard =  React.createClass({
  getInitialState: function() {
    // var placeholder = [{name:"Loading...", user:{}, body:''}];
    var placeholder = [];
    return {mentioned: placeholder,
            reported: placeholder,
            closed: placeholder
           }
  },
  componentDidMount: function() {

    var re = /\?user=([\w-]*)/g; 
    var matches = re.exec(location.search);
    var username = null;
    if (matches !== null && matches.length == 2) {
      username = matches[1];
    }
    else {
      username = prompt("What's your GitHub username?")
      window.location += ("?user=" + username);
    }

    //var repoParams = '?type=all&per_page=100&sort=pushed&direction=desc'

    var expireTime = 3 * 60 * 60 * 1000; // 3 hour

    var sorting = "&sort=updated&direction=asec"

    var repos = ['servo/servo', 'servo/saltfs']

    for (var idx in repos) {
      cachedFetch('https://api.github.com/repos/' + repos[idx] + '/issues?mentioned=' + username + sorting, expireTime)
        .then(function(resultjson){
            this.setState({mentioned: this.state.mentioned.concat(resultjson).sort(compareByUpdatedTimeDesc)});
        }.bind(this))

      cachedFetch('https://api.github.com/repos/' + repos[idx] + '/issues?creator=' + username + sorting, expireTime)
        .then(function(resultjson){
            this.setState({reported: this.state.reported.concat(resultjson).sort(compareByUpdatedTimeDesc)});
        }.bind(this))

      cachedFetch('https://api.github.com/repos/' + repos[idx] + '/issues?mentioned=' + username + "&state=closed" + sorting , expireTime)
        .then(function(resultjson){
            this.setState({closed: this.state.closed.concat(resultjson).sort(compareByUpdatedTimeDesc)});
        }.bind(this))
    }
    /* Get org repos in which the user is*/
    /*
    fetch('https://api.github.com/users/' + username + '/orgs')
      .then(function(result){
          return result.json();
      })
    */
    // XXX there are two setState, we might need to make them explictly wait for 
    // each other

  },
  render: function(){
    return (
      h('div', {className:"mui-row"}, 
        h('div', {className:"mui-col-md-12"}, 
          h('div', {className:"mui-row"}, 
            h('h1', {className:"mui-col-md-6"}, "My Servo Dashboard"),
            h('div', {className:"mui-col-md-6 toolbar"}, 
              h('a', {href: "https://github.com/servo/servo/issues/new",
                      className: "mui-btn mui-btn--primary"}, 
                "New Issue"
              ),
              h('a', {href: "https://github.com/notifications/participating",
                      className: "mui-btn mui-btn--primary"}, 
                "Notifications"
              )
            )
          ),
          h('div', {className:"mui-row"}, 
            h('div', {className:"mui-col-md-12"}, 
              h('div', {className:"mui-row"}, 
                h('h3', {className:"mui-col-md-12"}, 'My Pull Requests')
              ),
              h(IssueList, {issues:this.state.reported.filter(function(i) {
                return i.hasOwnProperty('pull_request')
              })})
            )
          ),

          h('div', {className:"mui-row"}, 
            h('div', {className:"mui-col-md-12"}, 
              h('div', {className:"mui-row"}, 
                h('h3', {className:"mui-col-md-12"}, 'Mentioned')
              ),
              h(IssueList, {issues:this.state.mentioned})
            )
          ),

          h('div', {className:"mui-row"}, 
            h('div', {className:"mui-col-md-12"}, 
              h('div', {className:"mui-row"}, 
                h('h3', {className:"mui-col-md-12"}, 'Reported')
              ),
              h(IssueList, {issues:this.state.reported})
            )
          ),

          h('div', {className:"mui-row"}, 
            h('div', {className:"mui-col-md-12"}, 
              h('div', {className:"mui-row"}, 
                h('h3', {className:"mui-col-md-12"}, 'Recently Closed')
              ),
              h(IssueList, {issues:this.state.closed})
            )
          ),

          h('div', {className:"mui-row footer"}, 
            h('div', {className:"mui-col-md-12"}, 
              h('hr', {}),
              h('span', {}, "by Shing Lyu <shing.lyu@gmail.com> | "),
              h('a', {href:"https://github.com/shinglyu/servo-dashboard"}, "Source Code")
            )
          )
        )
      )
    )
  }
})
ReactDOM.render(React.createElement(Dashboard), document.getElementById('content'))
