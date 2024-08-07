"use client";

import React, { useEffect } from "react";

import Prism from "prismjs";
import Parse from "html-react-parser";

// loading the languages we want to use in our Prism component (for parsing code content)
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-aspnet";
import "prismjs/components/prism-sass";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-solidity";
import "prismjs/components/prism-json";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-r";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-go";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-mongodb";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";

interface Props {
  data: string;
}

const ParseHTML = ({ data }: Props) => {
  // Bcus of we are using the hook useEffect, this component will be CRS Client Side Rendered 'use client'
  useEffect(() => {
    // highlight all the content is perceived as code
    Prism.highlightAll();
  }, []);
  return <div>{Parse(data)}</div>;
};

export default ParseHTML;
