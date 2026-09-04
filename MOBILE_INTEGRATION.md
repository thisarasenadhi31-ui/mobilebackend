# Mobile Photo Sync API Integration

This guide explains how to integrate the mobile photo sync endpoint with your Kotlin/Android app.

## API Endpoint

**Base URL**: Your deployed Next.js app (e.g., `https://your-app.com`)

**Endpoint**: `POST /api/sync-photos`

## Payload Format

The PhotoSyncManager sends a JSON payload with the following structure:

```json
{
  "photos": [
    {
      "id": 12345,
      "displayName": "IMG_20250904_120530.jpg",
      "dateAdded": 1693737600,
      "dateModified": 1693737600,
      "path": "/storage/emulated/0/Pictures/IMG_20250904_120530.jpg",
      "size": 2048576
    }
  ],
  "timestamp": 1693737600000,
  "photoCount": 1
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `photos` | Array | Array of photo metadata objects |
| `photos[].id` | Number | Unique photo ID from Android MediaStore |
| `photos[].displayName` | String | File name of the photo |
| `photos[].dateAdded` | Number | Unix timestamp (seconds) when photo was added |
| `photos[].dateModified` | Number | Unix timestamp (seconds) when photo was last modified |
| `photos[].path` | String | File system path to the photo |
| `photos[].size` | Number | File size in bytes |
| `timestamp` | Number | Request timestamp in milliseconds |
| `photoCount` | Number | Number of photos being synced |

## Integration with PhotoSyncManager

The PhotoSyncManager is already configured to send photos to the API. To use it:

### Update API URL

In your Android app, configure the API endpoint:

```kotlin
val apiUrl = "https://your-app.com/api/sync-photos"
```

### Sync All Photos

```kotlin
PhotoSyncManager.syncPhotosToAPI(
    context = context,
    apiUrl = apiUrl,
    onSuccess = { message ->
        Log.d("PhotoSync", "Success: $message")
    },
    onError = { error ->
        Log.e("PhotoSync", "Error: $error")
    }
)
```

### Sync Only New Photos

```kotlin
PhotoSyncManager.syncNewPhotosToAPI(
    context = context,
    apiUrl = apiUrl,
    onSuccess = { message ->
        Log.d("PhotoSync", "Success: $message")
    },
    onError = { error ->
        Log.e("PhotoSync", "Error: $error")
    }
)
```

## Response Format

### Success Response (HTTP 200)

```json
{
  "success": true,
  "message": "Successfully synced 1 photo(s)",
  "syncedCount": 1,
  "timestamp": "2025-09-04T12:30:00.000Z"
}
```

### Error Response (HTTP 400/500)

```json
{
  "success": false,
  "message": "Failed to sync photos",
  "error": "Invalid payload format"
}
```

## Database Schema

Photos are stored in the `mobile_photos` table with the following structure:

```sql
CREATE TABLE mobile_photos (
  id UUID PRIMARY KEY,
  photo_id BIGINT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  date_added BIGINT NOT NULL,
  date_modified BIGINT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Viewing Synced Photos

### In the Web App

1. Visit the Gallery page: `https://your-app.com/gallery`
2. Synced photos appear in the "Synced Mobile Photos" section
3. View metadata including:
   - Photo file name
   - File size
   - Sync timestamp

### Via API

Fetch synced photos using the Supabase client:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("mobile_photos")
  .select("*")
  .order("synced_at", { ascending: false });
```

## Error Handling

The endpoint validates the payload and returns appropriate error codes:

| HTTP Code | Reason |
|-----------|--------|
| 200 | Photos synced successfully |
| 400 | Invalid payload format |
| 500 | Server error (database, etc.) |

Common validation errors:

- Missing `photos` array
- Missing required fields in photo objects
- Invalid data types

## Security Considerations

Currently, the endpoint has **no authentication**. For production:

1. Add authentication/authorization
2. Rate limit the endpoint
3. Validate file paths and names
4. Consider implementing API keys or JWT tokens

Example with API key authentication:

```kotlin
connection.setRequestProperty("Authorization", "Bearer YOUR_API_KEY")
```

## Deployment

1. Run Supabase migrations:
   ```bash
   npx supabase db push
   ```

2. Deploy the Next.js app to production

3. Update the mobile app to use the production API URL

4. Test the sync flow on a device or emulator

## Troubleshooting

### Photos not appearing in database

1. Check network connectivity from device
2. Verify API endpoint URL is correct
3. Check server logs for errors
4. Ensure Supabase tables are created (run migrations)

### Sync fails with 400 error

1. Verify payload matches expected format
2. Check that all required fields are present
3. Validate data types (numbers should be `long`, not `String`)

### Rate limiting

If syncing large batches of photos, consider:

1. Implementing batch sync with pagination
2. Adding delays between sync requests
3. Using background work scheduling (already implemented in PhotoFetchWorker)

## Next Steps

1. **Image Upload**: Currently only metadata is synced. To upload actual images:
   - Consider using Supabase Storage for image files
   - Modify PhotoSyncManager to send base64 encoded images or use multipart/form-data
   - Implement a separate image upload endpoint

2. **Background Sync**: The PhotoFetchWorker is configured to run every 60 minutes
   - Update the `SYNC_INTERVAL_MINUTES` constant in GalleryAccessManager
   - Trigger sync when new photos are detected

3. **Push Notifications**: Notify users when sync completes
   - Implement Firebase Cloud Messaging (FCM)
   - Handle notification taps to open gallery
