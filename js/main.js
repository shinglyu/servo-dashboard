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

    var isPull = h('span', {className: "mui-col-md-1"}, "ISSUE")
    if (info.hasOwnProperty('pull_request')) {
      isPull = h('span', {className: "mui-col-md-1"}, "PR")
    }

    return (
      h('div', {className:"mui-col-md-12 repo-card"}, 
        h('div', {
            className:"mui-panel mui-row", 
            onClick:this.handleClick, 
            title: info.body
          }, 
          isPull,
          h('a', {href: info.html_url, className:"mui-col-md-5"}, 
            h('p', null, info.title)
          ),
          h('a', {href: info.repository_url.replace('api.github.com/repos/', 'github.com/'), className:"mui-col-md-2"}, info.repository_url.replace('https://api.github.com/repos/', '')),
          h('p', {className:"mui-col-md-1"}, 
            h('a', {href:info.user.html_url}, info.user.login)
          ),
          //h('p', {className:"body"}, info.body),
          h('p', {className:"mui-col-md-3 col-time"}, 
            h('span', {className:"updated_time"}, new Date(info.updated_at).toLocaleString())
          )
        )
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
      h('div', {className:"mui-row"}, lis)
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

    var expireTime = 12 * 60 * 60 * 1000; // 12 hour

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
        h('div', {className:"mui-row"}, 
          h('h1', {className:"mui-col-md-12"}, "My Servo Dashboard")
         ),
        h('div', {className:"mui-row"}, 
          h('h3', {className:"mui-col-md-12"}, 'Mentioned'),
          h(IssueList, {issues:this.state.mentioned})
         ),
        h('div', {className:"mui-row"}, 
          h('h3', {className:"mui-col-md-12"}, 'Reported'),
          h(IssueList, {issues:this.state.reported})
         ),
        h('div', {className:"mui-row"}, 
          h('h3', {className:"mui-col-md-12"}, 'Recently Closed'),
          h(IssueList, {issues:this.state.closed})
         )
       )
    )
  }
})
ReactDOM.render(React.createElement(Dashboard), document.getElementById('content'))
