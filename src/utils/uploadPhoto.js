/**
 * uploadPhoto.js — picks an image from the device gallery and uploads it to
 * the backend POST /upload endpoint, returning the permanent Vercel Blob URL.
 *
 * Usage:
 *   const url = await pickAndUpload(token);
 *   if (url) { /* add to photos array *\/ }
 */
import * as ImagePicker from 'expo-image-picker';

export async function pickAndUpload(token) {
  // Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access photos was denied.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const uri   = asset.uri;

  // Build multipart form data
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match    = /\.(\w+)$/.exec(filename);
  const type     = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', { uri, name: filename, type });

  const API_URL = process.env.EXPO_PUBLIC_API_URL;

  // POST to the upload endpoint (multipart, not JSON)
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Upload failed.');
  }

  const data = await response.json();
  return data.url;
}
