import React from 'react';
import './App.css';
import CodeValidator from './CodeValidator';

function App() {
  return (
    <>
      <div>
        <a href="https://www.geeksforgeeks.org/" target="_blank">
          <img className ="logo" src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="geeksforgeeks logo"/>
        </a>
      </div>
      <h1>GFG WEB DEV Validator</h1>
      <CodeValidator />
    </>
  );
}

export default App;