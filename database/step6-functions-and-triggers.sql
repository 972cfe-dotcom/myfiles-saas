-- Step 6: Functions and Triggers

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user data
CREATE OR REPLACE FUNCTION create_default_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (name, description, color, user_id) VALUES
    ('מסמכים כלליים', 'מסמכים כלליים וחשובים', '#4f46e5', user_uuid),
    ('חוזים', 'חוזים והסכמים', '#059669', user_uuid),
    ('חשבוניות', 'חשבוניות ומסמכים פיננסיים', '#dc2626', user_uuid),
    ('תעודות', 'תעודות והסמכות', '#7c3aed', user_uuid),
    ('עבודה', 'מסמכי עבודה ופרויקטים', '#ea580c', user_uuid);
  
  INSERT INTO tags (name, color, user_id) VALUES
    ('חשוב', '#dc2626', user_uuid),
    ('דחוף', '#f59e0b', user_uuid),
    ('לבדיקה', '#3b82f6', user_uuid),
    ('מאושר', '#059669', user_uuid),
    ('ארכיון', '#6b7280', user_uuid);
  
  INSERT INTO user_settings (user_id) VALUES (user_uuid);
END;
$$ LANGUAGE 'plpgsql';

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE TRIGGER update_tag_usage_on_document_tags
  AFTER INSERT OR DELETE ON document_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE 'plpgsql';