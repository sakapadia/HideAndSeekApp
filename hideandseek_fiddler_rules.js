// Hide and Seek - Custom Fiddler Rules
// Import this into Fiddler Classic: Rules -> Customize Rules

// Color coding for different types of requests
static function OnBeforeRequest(oSession: Session) {
    // Highlight Hide and Seek application traffic
    if (oSession.host.Contains("localhost:5264") || 
        oSession.host.Contains("localhost:50695")) {
        oSession["ui-color"] = "orange";
        oSession["ui-bold"] = "true";
    }
    
    // Highlight authentication requests
    if (oSession.url.Contains("/api/auth/") || 
        oSession.url.Contains("oauth") ||
        oSession.url.Contains("google")) {
        oSession["ui-color"] = "red";
        oSession["ui-bold"] = "true";
        oSession["ui-backcolor"] = "yellow";
    }
    
    // Highlight noise report API calls
    if (oSession.url.Contains("/api/noisereports")) {
        oSession["ui-color"] = "blue";
        oSession["ui-bold"] = "true";
    }
    
    // Highlight user management API calls
    if (oSession.url.Contains("/api/users/")) {
        oSession["ui-color"] = "green";
        oSession["ui-bold"] = "true";
    }
    
    // Log important requests to Fiddler's log
    if (oSession.url.Contains("/api/")) {
        FiddlerObject.log("🔍 Hide and Seek API Call: " + oSession.url);
    }
}

// Break on authentication errors
static function OnBeforeResponse(oSession: Session) {
    // Break on authentication failures
    if (oSession.url.Contains("/api/auth/") && oSession.responseCode >= 400) {
        oSession["x-breakresponse"] = "true";
        FiddlerObject.log("🚨 Authentication Error: " + oSession.url + " - Status: " + oSession.responseCode);
    }
    
    // Break on API errors
    if (oSession.url.Contains("/api/") && oSession.responseCode >= 500) {
        oSession["x-breakresponse"] = "true";
        FiddlerObject.log("💥 Server Error: " + oSession.url + " - Status: " + oSession.responseCode);
    }
    
    // Log JWT tokens in responses (for debugging)
    if (oSession.url.Contains("/api/auth/") && oSession.responseCode == 200) {
        var responseBody = oSession.GetResponseBodyAsString();
        if (responseBody.Contains("token") || responseBody.Contains("jwt")) {
            FiddlerObject.log("🔑 JWT Token Response: " + oSession.url);
        }
    }
}

// Custom column to show request type
public static RulesOption("Hide and Seek Request Type")
var m_RequestType: String = "Unknown";

static function OnBeforeRequest(oSession: Session) {
    if (oSession.url.Contains("/api/auth/")) {
        m_RequestType = "Auth";
    } else if (oSession.url.Contains("/api/noisereports")) {
        m_RequestType = "Reports";
    } else if (oSession.url.Contains("/api/users/")) {
        m_RequestType = "Users";
    } else if (oSession.host.Contains("localhost:5264") || oSession.host.Contains("localhost:50696")) {
        m_RequestType = "App";
    } else {
        m_RequestType = "Other";
    }
    
    oSession["ui-customcolumn"] = m_RequestType;
}

// Filter to show only Hide and Seek traffic
static function OnBeforeRequest(oSession: Session) {
    // Only show traffic from your application
    if (!oSession.host.Contains("localhost:5264") && 
        !oSession.host.Contains("localhost:50696") &&
        !oSession.host.Contains("google") &&
        !oSession.host.Contains("accounts.google.com")) {
        oSession["ui-hide"] = "true";
    }
}

// Performance monitoring
static function OnBeforeResponse(oSession: Session) {
    // Log slow API calls
    if (oSession.url.Contains("/api/") && oSession.timers.ServerBeginResponse > 1000) {
        FiddlerObject.log("🐌 Slow API Call: " + oSession.url + " - Time: " + oSession.timers.ServerBeginResponse + "ms");
    }
}

// Custom menu item to clear Hide and Seek traffic
static function OnExecAction(sender: FiddlerApplication, oAction: String) {
    if (oAction == "Clear Hide and Seek Traffic") {
        var oSessions = FiddlerApplication.UI.GetAllSessions();
        for (var i = 0; i < oSessions.Length; i++) {
            var oSession = oSessions[i];
            if (oSession.host.Contains("localhost:5264") || 
                oSession.host.Contains("localhost:50696")) {
                oSession.Delete();
            }
        }
    }
}
