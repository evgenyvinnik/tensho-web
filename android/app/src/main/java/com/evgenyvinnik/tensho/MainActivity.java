package com.evgenyvinnik.tensho;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // As in the iOS SceneDelegate: AudioSystem pauses the music on these,
    // when the screen locks or another app or a full-screen ad comes in front.
    @Override
    public void onPause() {
        super.onPause();
        triggerPageEvent("appinactive");
    }

    @Override
    public void onResume() {
        super.onResume();
        triggerPageEvent("appactive");
    }

    // Before the page has loaded there is no listener, nor window.Capacitor.
    private void triggerPageEvent(String name) {
        Bridge bridge = getBridge();
        if (bridge == null || bridge.getWebView() == null || bridge.getWebView().getProgress() < 100) return;
        bridge.triggerDocumentJSEvent(name);
    }
}
