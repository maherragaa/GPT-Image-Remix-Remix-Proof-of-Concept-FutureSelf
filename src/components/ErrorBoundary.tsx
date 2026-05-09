import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State | null {
    let parsedInfo = null;
    try {
      if (error.message.includes("operationType")) {
        parsedInfo = JSON.parse(error.message);
      }
    } catch (e) {
      // Not our json
    }
    
    return { hasError: true, errorMessage: error.message, errorInfo: parsedInfo };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
          <div className="bg-white rounded-none md:rounded-lg max-w-2xl w-full p-8 space-y-6">
            <h1 className="text-2xl font-bold text-red-600 border-b pb-4">Application Error</h1>
            
            {this.state.errorInfo ? (
              <div className="space-y-4">
                <p className="text-slate-800 font-medium">A database permission or connection issue occurred:</p>
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm font-mono overflow-x-auto">
                  <p><span className="font-bold">Error:</span> {this.state.errorInfo.error}</p>
                  <p><span className="font-bold">Operation:</span> {this.state.errorInfo.operationType}</p>
                  <p><span className="font-bold">Path:</span> {this.state.errorInfo.path}</p>
                  <p><span className="font-bold">User Status:</span> {this.state.errorInfo.authInfo.isAnonymous ? "Guest" : "Registered"} (ID: {this.state.errorInfo.authInfo.userId || "None"})</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 bg-slate-100 p-4 rounded-xl font-mono text-sm">
                {this.state.errorMessage}
              </p>
            )}
            
            <p className="text-sm text-slate-500">
              Check the console for more details. Try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
