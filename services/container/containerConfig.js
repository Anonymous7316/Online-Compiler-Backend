export const containerImages = {
  python: "python:latest",
  javascript: "node:slim",
  java: "openjdk:27-ea-oraclelinux9",
  cpp: "gcc:latest",
  ruby: "ruby:latest",
  go: "golang:latest",
};

export const fileExtensions = {
  python: "py",
  javascript: "js",
  java: "java",
  cpp: "cpp",
  ruby: "rb",
  go: "go",
};

export const executionCommands = {
  python: (filename)=>`python3 ${filename}`,
  javascript: (filename)=>`node ${filename}`,
  java: (filename)=>`javac ${filename} && java ${filename.replace('.java', '')}`,
  cpp: (filename)=>`g++ ${filename} -o ${filename.replace('.cpp', '')} && ./${filename.replace('.cpp', '')}`,
  ruby: (filename)=>`ruby ${filename}`,
  go: (filename)=>`go run ${filename}`,
};