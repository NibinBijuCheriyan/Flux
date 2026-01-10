-- Add daily_number column to tokens table
ALTER TABLE tokens 
ADD COLUMN IF NOT EXISTS daily_number INTEGER;

-- Create a function to calculate the next daily number
CREATE OR REPLACE FUNCTION get_next_daily_token_number()
RETURNS TRIGGER AS $$
DECLARE
    next_num INTEGER;
    today_start TIMESTAMPTZ;
    today_end TIMESTAMPTZ;
BEGIN
    -- Set the time zone to IST (Indian Standard Time) for the day calculation
    -- You can change 'Asia/Kolkata' to your desired timezone
    today_start := date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata');
    today_end := today_start + INTERVAL '1 day';

    -- Get the maximum daily_number for today
    SELECT COALESCE(MAX(daily_number), 0) INTO next_num
    FROM tokens
    WHERE generated_at >= today_start AND generated_at < today_end;

    -- Increment by 1
    NEW.daily_number := next_num + 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS set_daily_token_number ON tokens;

CREATE TRIGGER set_daily_token_number
BEFORE INSERT ON tokens
FOR EACH ROW
EXECUTE FUNCTION get_next_daily_token_number();
