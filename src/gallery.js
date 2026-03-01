// Gallery — stub (Firestore integration in Phase 5)

export async function publishOutfit(avatarCanvas, codename, roomId) {
  // TODO: upload screenshot to Storage, write Firestore doc
}

export async function fetchGallery(limit = 20) {
  // TODO: query Firestore gallery collection
  return [];
}

export async function reportPost(postId) {
  // TODO: increment reportCount, create reports entry
}
