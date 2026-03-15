use dioxus::prelude::*;
use flaskgen::Flask3d;

#[component]
pub fn App() -> Element {
    rsx! {
        div { class: "app",
            Flask3d { show_back_button: false, on_navigate_back: move |_| {} }
        }
    }
}
