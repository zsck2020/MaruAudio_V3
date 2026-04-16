use std::sync::Mutex;

#[derive(Default)]
pub struct SessionState {
    refresh_token: Mutex<Option<String>>,
}

impl SessionState {
    pub fn set_refresh_token(&self, refresh_token: impl Into<String>) {
        if let Ok(mut guard) = self.refresh_token.lock() {
            *guard = Some(refresh_token.into());
        }
    }

    pub fn get_refresh_token(&self) -> Option<String> {
        self.refresh_token
            .lock()
            .ok()
            .and_then(|guard| guard.clone())
    }

    pub fn clear_refresh_token(&self) {
        if let Ok(mut guard) = self.refresh_token.lock() {
            *guard = None;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::SessionState;

    #[test]
    fn refresh_token_lives_only_in_memory() {
        let session = SessionState::default();
        session.set_refresh_token("refresh-token");

        assert_eq!(session.get_refresh_token().as_deref(), Some("refresh-token"));

        session.clear_refresh_token();
        assert_eq!(session.get_refresh_token(), None);
    }
}