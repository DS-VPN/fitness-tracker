const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;

export function validateUsername(username: string): string | null {
	if (!USERNAME_PATTERN.test(username)) {
		return 'Username must be 3-24 characters: letters, numbers, underscore, or hyphen only.';
	}
	return null;
}

export function validatePassword(password: string): string | null {
	if (password.length < 8) return 'Password must be at least 8 characters.';
	return null;
}
