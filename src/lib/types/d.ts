// src/types/global.d.ts

// First, ensure the script is treated as a module by adding an export statement.
export {};

// Extend the Window interface
declare global {
  interface Window {
    ergoConnector: any;  // Assuming ErgoConnector is the type you want to add
    ergo: any;
  }
  var ergo: any;
}