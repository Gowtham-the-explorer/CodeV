import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './CodeValidator.css';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h2`
  text-align: center;
  color: #333;
`;

const CodeArea = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const InputArea = styled.textarea`
position: relative;
width: 40vw;
height: 60vh;
font-size: 14px;
border-radius: 4px;
border: 1px solid #ccc;
padding: 10px;
margin: 20px;
`;

const CodeEditor = styled(SyntaxHighlighter)`
  width: 100%;
  height: 400px;
  font-size: 14px;
  border-radius: 4px;
  overflow: auto;
`;

const Button = styled.button`
  display: block;
  margin: 0 auto;
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const FeedbackList = styled.ul`
  list-style-type: none;
  padding: 0;
`;

const FeedbackItem = styled.li`
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 10px;
  color: #721c24;
`;

const SuccessMessage = styled.p`
  padding: 10px;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
`;

const extractCssSelectors = (cssCode) => {
  const selectorRegex = /([^{]+){/g;
  const selectors = [];
  let match;

  while ((match = selectorRegex.exec(cssCode)) !== null) {
    selectors.push(match[1].trim());
  }

  return selectors;
};

const isValidSelector = (selector) => {
  const bemRegex = /^([a-z]+)(?:__([a-z]+))?(?:--([a-z]+))?$/;
  return bemRegex.test(selector);
};

const getSpecificity = (selector) => {
  let specificity = 0;
  const idCount = (selector.match(/\#/g) || []).length;
  const classCount = (selector.match(/\./g) || []).length;
  const elementCount = (selector.match(/[a-zA-Z]+/g) || []).length - classCount;

  specificity = idCount * 100 + classCount * 10 + elementCount;

  return specificity;
};

const checkPropertyOrder = (cssCode) => {
  const propertyOrder = [
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'display',
    'flex',
    'flex-*',
    'grid',
    'grid-*',
    'box-sizing',
    'width',
    'height',
    'margin',
    'margin-*',
    'padding',
    'padding-*',
    'border',
    'border-*',
    'background',
    'background-*',
    'color',
    'font',
    'font-*',
    'text-*',
    'transition',
    'transition-*',
    'transform',
    'transform-*',
    'animation',
    'animation-*',
    'opacity',
    'z-index',
    'cursor',
    'overflow',
    'overflow-*',
    'box-shadow',
    'outline',
    'outline-*',
    'list-style',
    'list-style-*',
    'table-layout',
    'caption-side',
    'quotes',
    'counter-*',
    'resize',
    'user-select',
    'nav-*',
  ];

  const lines = cssCode.split('\n');
  const propertyOrderIssues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('}')) continue; // Skip closing braces

    const properties = line.slice(line.indexOf('{') + 1, line.lastIndexOf('}')).trim().split(';');
    const propertyNames = properties.map((prop) => prop.trim().split(':')[0].trim());

    for (let j = 0; j < propertyNames.length - 1; j++) {
      const currentProp = propertyNames[j];
      const nextProp = propertyNames[j + 1];

      const currentPropIndex = propertyOrder.indexOf(currentProp.split('-')[0]);
      const nextPropIndex = propertyOrder.indexOf(nextProp.split('-')[0]);

      if (currentPropIndex > nextPropIndex && currentPropIndex !== -1 && nextPropIndex !== -1) {
        propertyOrderIssues.push(`Line ${i + 1}: The property "${nextProp}" should be declared before "${currentProp}".`);
      }
    }
  }

  return propertyOrderIssues;
};

const checkColorNaming = (cssCode) => {
  const colorNameIssues = [];
  const lines = cssCode.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const colorRegex = /(color|background-color):\s*([^;]+)/g;
    let match;

    while ((match = colorRegex.exec(line)) !== null) {
      const colorValue = match[2].trim();
      if (isHexColor(colorValue) && !isValidHexColorName(colorValue)) {
        colorNameIssues.push(`Line ${i + 1}: Hex color "${colorValue}" should have a descriptive name.`);
      }
    }
  }

  return colorNameIssues;
};

const isHexColor = (value) => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(value);
};

const isValidHexColorName = (hexColor) => {
  const validColorNames = [
    'red',
    'green',
    'blue',
    'yellow',
    'orange',
    'purple',
    'black',
    'white',
    'gray',
    'light',
    'dark',
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
  ];

  const hexValue = hexColor.replace('#', '');
  for (const name of validColorNames) {
    if (hexValue.includes(name)) {
      return true;
    }
  }

  return false;
};

const CodeValidator = () => {
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const defaultHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    /* Write your CSS here */
  </style>
</head>
<body>
  <!-- Write your HTML here -->
</body>
</html>`;

    const defaultCssCode = `/* Reset styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Basic styles */
body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

/* Header styles */
header {
  background-color: #333;
  color: #fff;
  padding: 10px;
}

nav ul {
  list-style-type: none;
  display: flex;
}

nav ul li {
  margin-right: 20px;
}

nav ul li a {
  color: #fff;
  text-decoration: none;
}

/* Main content styles */
main {
  padding: 20px;
}

section {
  margin-bottom: 40px;
}

/* Footer styles */
footer {
  background-color: #333;
  color: #fff;
  text-align: center;
  padding: 10px;
}

/* Responsive styles */
@media (max-width: 768px) {
  nav ul {
    flex-direction: column;
  }

  nav ul li {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
`;
    setHtmlCode(defaultHtmlCode);
    setCssCode(defaultCssCode);
  }, []);

  const validateCodeSubmission = () => {
    const selectorIssues = [];
    const specificityIssues = [];
    const propertyOrderIssues = [];
    const colorNamingIssues = [];

    const selectors = extractCssSelectors(cssCode);

    selectors.forEach((selector, index) => {
      if (!isValidSelector(selector)) {
        selectorIssues.push(`Invalid selector at line ${index + 1}: "${selector}".`);
      }

      const specificity = getSpecificity(selector);
      if (specificity < 10) {
        specificityIssues.push(`Low specificity at line ${index + 1}: "${selector}" has a specificity of ${specificity}.`);
      }
    });

    propertyOrderIssues.push(...checkPropertyOrder(cssCode));
    colorNamingIssues.push(...checkColorNaming(cssCode));

    const allFeedback = [
      ...selectorIssues,
      ...specificityIssues,
      ...propertyOrderIssues,
      ...colorNamingIssues,
    ];

    setFeedback(allFeedback);
  };

  return (
    <Container>
      <CodeArea>
        <InputArea language="html" style={dark}  value={htmlCode} showLineNumbers onChange={(code) => setHtmlCode(code.target.value)}>
          {htmlCode}
        </InputArea>
        <InputArea language="css" style={dark} showLineNumbers value={cssCode} onChange={(code) => setCssCode(code.target.value)}>
          {cssCode}
        </InputArea>
      </CodeArea>
      <Button onClick={validateCodeSubmission}>Validate Code</Button>
      <FeedbackList>
        {feedback.length > 0 ? (
          feedback.map((item, index) => (
            <FeedbackItem key={index}>
              {item}
            </FeedbackItem>
          ))
        ) : (
          <SuccessMessage>No issues found!</SuccessMessage>
        )}
      </FeedbackList>
    </Container>
  );
};

export default CodeValidator;
