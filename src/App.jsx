import React, { Component } from 'react';
import './App.css';
import { Grid, Row, Col, FormGroup, ControlLabel, FormControl, HelpBlock, Button, Glyphicon, Badge } from 'react-bootstrap';
import $ from 'jquery';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'
import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
var io = sailsIOClient(socketIOClient);
io.sails.url = 'https://shoutout-api.herokuapp.com';

class App extends Component {
  render() {
    return (
      <div>
        <Navbar />
        <EngineeringMessage />
        <MainPanel />
        <Footer />
      </div>
    );
  }
}

class Navbar extends React.Component {
  render () {
    return (
      <div id="navbar">
        <span><i className="fa fa-bullhorn" id="logo" aria-hidden="true"></i></span>
        <h1>Welcome to <span className="shoutout-font">ShoutOut</span></h1>
        <h3>What's on your mind?</h3>
      </div>
    )
  }
}

class EngineeringMessage extends React.Component {
  render () {
    return (
      <div id="engineering-message">
        <p>Built with <i className="fa fa-heart" aria-hidden="true"></i> using <a href="https://facebook.github.io/react/">React.js</a>, <a href="http://sailsjs.com/">Sails.js</a> and <a href="http://socket.io/">Socket.io</a></p>
      </div>
    )
  }
}

class MainPanel extends React.Component {
  render () {
    return (
      <Grid>
        <Row className="show-grid">
          <Col xs={12} md={8}><ShoutoutPane /></Col>
          <Col xs={12} md={4}><InfoPane /></Col>
        </Row>
      </Grid>
    )
  }
}

class InfoPane extends React.Component {
  render () {
    return (
      <div>
        <h3>How to use.</h3>
        <p>Just type what's on your mind and click enter on you keyboard. If anyone else writes something, the list of 'Shoutouts' will be <b>updated in real-time.</b></p>
        <h3>How it works.</h3>
        <p>The client code was built with React.js, and the backend with Sails.js. After the client submits a shoutout, a POST request is sent to the server, which persists the record (via Waterline ORM and PostgreSQL DB) and then broadcasts the new record to all subscribing clients with the help of Socket.io. Upon receiving the socket broadcast, React gracefully updates the list of shoutouts on the DOM.</p>
        <h3>Why.</h3>
        <p>Been an Angular.js guy for a while, decided to learn React.js, loving it so far. Also a huge Sails.js fan, checkout a penny auction I built using it: <a href="https://biddybomb.com>">biddybomb.com</a></p>
        <a href="https://github.com/CodeSchneider/shoutout-client" className="github-link"><i className="fa fa-github" aria-hidden="true"></i> Client code</a>
        <a href="https://github.com/CodeSchneider/shoutout-api" className="github-link"><i className="fa fa-github" aria-hidden="true"></i> Api code</a>
      </div>
    )
  }
}

class ShoutoutPane extends React.Component {
  render () {
    return (
      <div>
        <ShoutoutForm />
        <ShoutoutList />
      </div>
    )
  }
}

class ShoutoutList extends React.Component {
  constructor() {
    super();
    this.state = {
      shoutouts: []
    };
    this.componentDidMount = this.componentDidMount.bind(this);
  }

  componentDidMount() {
    this.serverRequest =
      $
        .get("https://shoutout-api.herokuapp.com/api/shoutouts")
        .then(function(shoutouts) {
          this.setState({
            shoutouts: shoutouts
          });
        }.bind(this))

    io.socket.on('shoutout', (data) => {
      let shoutouts = this.state.shoutouts;
      shoutouts.unshift(data);
      shoutouts = shoutouts.slice(0, 10);
      this.setState({
        shoutouts: shoutouts
      });
    });
  }

  componentWillUnmount() {
    this.serverRequest.abort();
  }

  render () {
    return (
      <ul id="shoutoutList">
        <ReactCSSTransitionGroup
          transitionName="shoutout"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}>
          {this.state.shoutouts.map((shoutout) => {
            return (<li key={shoutout.id}>
                      <div className="shoutoutContent">{shoutout.content}</div>
                      <div className="shoutoutMeta">
                        <span><i className="fa fa-clock-o" aria-hidden="true"></i> <b>{shoutout.time}</b></span>
                      </div>
                    </li>)
          })}
        </ReactCSSTransitionGroup>
      </ul>
    )
  }
}

class ShoutoutForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      loading: false
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.onSuccess = this.onSuccess.bind(this);
    this.hideLoading = this.hideLoading.bind(this);
  }

  getValidationState() {
    const length = this.state.value.length;
    if (length > 10 && length < 301) return 'success';
    else if (length > 5) return 'warning';
    else if (length > 0) return 'error';
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  createShoutout() {
    return $.ajax({
      url: 'https://shoutout-api.herokuapp.com/api/shoutouts',
      type: 'POST',
      data: {
        shoutout: this.state.value,
      },
      beforeSend: function () {
        this.setState({loading: true});
      }.bind(this)
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.getValidationState() !== 'success') {
      return;
    }
    var xhr = this.createShoutout();
    xhr.done(this.onSuccess)
    .fail(this.onError)
    .always(this.hideLoading)
  }

  hideLoading() {
    this.setState({loading: false});
  }

  onSuccess(data) {
    this.setState({value: ''});
  }

  onError(data) {
    var message = "Failed to create the user";
    var res = data.responseJSON;
    if(res.message) {
      message = data.responseJSON.message;
    }
    if(res.errors) {
      this.setState({
        errors: res.errors
      });
    }
  }

  render () {
    return (
      <form onSubmit={this.handleSubmit}>
        <FormGroup
          controlId="formBasicText"
          validationState={this.getValidationState()}
        >
          <ControlLabel>Say whatever you want.</ControlLabel>
          <FormControl
            type="text"
            value={this.state.value}
            placeholder="Start typing...press enter to submit"
            onChange={this.handleChange}
          />
          <FormControl.Feedback />
          <HelpBlock>{this.state.value.length}/300</HelpBlock>
        </FormGroup>
      </form>
    );
  }
}

class Footer extends React.Component {
  render () {
    return (
      <footer>
        <a id="cs-link" href="https://codeschneider.com">CODESCHNEIDER</a>
      </footer>
    )
  }
}

export default App;
