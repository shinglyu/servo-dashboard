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
    }
    */


    var description = info.description;
    var maxLength = 70;
    if (description != null && description.length > maxLength) {
      description = description.slice(0, maxLength) + "......"
    }

    return (
      h('div', {className:"mui-col-md-12 repo-card"}, 
        h('div', {
            className:"mui-panel mui-row", 
            onClick:this.handleClick, 
            title: info.body
          }, 
          h('a', {href: info.html_url, className:"mui-col-md-8"}, 
            h('p', null, info.title)
          ),
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

var Dashboard =  React.createClass({
  getInitialState: function() {
    var placeholder = [{name:"Loading...", user:{}, body:''}];
    return {mentioned: placeholder,
            reported: placeholder
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

    cachedFetch('https://api.github.com/repos/servo/servo/issues?mentioned=' + username + sorting, expireTime)
      .then(function(resultjson){
          this.setState({mentioned: resultjson});
      }.bind(this))

    cachedFetch('https://api.github.com/repos/servo/servo/issues?creator=' + username + sorting, expireTime)
      .then(function(resultjson){
          this.setState({reported: resultjson});
      }.bind(this))

    cachedFetch('https://api.github.com/repos/servo/servo/issues?creator=' + username , expireTime)
      .then(function(resultjson){
          this.setState({reported: resultjson});
      }.bind(this))
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
         )
       )
    )
  }
})
ReactDOM.render(React.createElement(Dashboard), document.getElementById('content'))
