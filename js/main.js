var h = React.createElement;
var Issue =  React.createClass({
  createFormat: function(title, content) {
    var d1 = document.createElement('div');
    var p1 = document.createElement('h3');
    p1.textContent = title;
    d1.appendChild(p1);
    var c1 = document.createElement('input');
    c1.type = "text";
    c1.value = content;
    c1.onfocus = function(){ 
      this.select();
      document.execCommand('copy');
    };
    d1.appendChild(c1);
    return d1;
  },

  createFormatModal: function(){
    var modal = document.createElement('div');
    modal.className = 'modal';

    modal.appendChild(this.createFormat("WikiText:", 
                      "[" + this.props.issueinfo.html_url + 
                      " #" + this.props.issueinfo.number + 
                      "]: " + this.props.issueinfo.title));

    modal.appendChild(this.createFormat("Markdown:",  
                      "[#" + this.props.issueinfo.number + 
                      "](" + this.props.issueinfo.html_url + 
                      "): " + this.props.issueinfo.title));

    var hr = document.createElement('hr')
    var p = document.createElement('p');
    p.textContent = "Click the input box to auto-copy the text to clipboard";
    modal.appendChild(hr);
    modal.appendChild(p);

    return modal
  },
  handleClick: function() {
    //window.location = this.props.issueinfo.html_url;
    mui.overlay('on', this.createFormatModal());
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
          //onClick:this.handleClick, 
          title: info.body
        }, 
        h('span', {className:"meta mui-col-md-3 mui-col-xs-12"}, 
            h('a', {href: info.repository_url.replace('api.github.com/repos/', 'github.com/'), 
                    className:"repo mui-col-md-12 mui-col-xs-6"
                   }, 
                   info.repository_url.replace('https://api.github.com/repos/', '')),
            h('a', {href: "javascript:;", onClick: this.handleClick, className:"number mui-col-md-12 mui-col-xs-6"}, isPull + "#" + info.number)
        ),
        
        h('a', {href: info.html_url, className:"title mui-col-md-6 mui-col-xs-12"}, info.title),
        h('span', {className:"meta-footer mui-col-md-3 mui-col-xs-12"}, 
          h('a', {href:info.user.html_url, className:"mui-col-md-12 mui-col-xs-4"}, info.user.login),
          //h('p', {className:"body"}, info.body),
          //h('span', {className:"updated_time mui-col-md-12 mui-col-xs-8 col-time"}, new Date(info.updated_at).toLocaleString())
          h('span', {
            className:"updated_time mui-col-md-12 mui-col-xs-8 col-time",
            title: new Date(info.updated_at).toString()
          }, moment(info.updated_at).fromNow())
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
      h('div', {className:"mui-row"}, 
        h('div', {className:"mui-col-md-12"}, 
          lis
        )
      )
    )
  }
})

var IssueListSection =  React.createClass({
  render: function(){
    return (
      h('div', {className:"mui-row"}, 
        h('div', {className:"mui-col-md-12"}, 
          h('div', {className:"mui-row"}, 
            h('h3', {className:"mui-col-md-12"}, this.props.title)
          ),
          h(IssueList, {issues:this.props.issues})
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

    var repos = ['servo/servo', 'servo/saltfs', 'shinglyu/servo-perf']

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
            h('div', {className:"mui-col-md-6"}, 

              h(IssueListSection, {
                title: 'Reviewing Pull Requests',
                issues:this.state.mentioned.filter(function(i) {
                    return i.hasOwnProperty('pull_request')
                  })
              })
            ),

            h('div', {className:"mui-col-md-6"}, 
              h(IssueListSection, {
                title: 'My Pull Requests',
                issues:this.state.reported.filter(function(i) {
                    return i.hasOwnProperty('pull_request')
                  })
              })
            )
          ),
          h('div', {className:"mui-row"}, 
            h('div', {className:"mui-col-md-6"}, 
              h(IssueListSection, {
                title: 'Mentioned',
                issues:this.state.mentioned
              })
            ),
            h('div', {className:"mui-col-md-6"}, 
              h(IssueListSection, {
                title: 'Reported',
                issues:this.state.reported
              })
            )
          ),

          h(IssueListSection, {
            title: 'Recently Closed',
            issues:this.state.closed
          })
        )
      )
    )
  }
})
ReactDOM.render(React.createElement(Dashboard), document.getElementById('content'))
