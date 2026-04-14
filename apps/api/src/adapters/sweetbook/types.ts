// SweetBook upstream types.
// These represent what we send TO and receive FROM SweetBook.
// They are intentionally separated from our frontend-facing contract
// so that upstream shape changes don't silently propagate to the UI.

export interface SweetBookBookPayload {
  title: string;
  subtitle: string;
  coverPhotoUrl: string;
  pages: SweetBookPage[];
}

export interface SweetBookPage {
  pageNumber: number;
  type: "cover" | "moment" | "letter" | "closing";
  title?: string;
  body?: string;
  photoUrl?: string;
}

export interface SweetBookBookResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface SweetBookOrderPayload {
  bookId: string;
  recipient: {
    name: string;
    phone: string;
    address1: string;
    address2: string;
    zipCode: string;
  };
}

export interface SweetBookOrderResponse {
  id: string;
  bookId: string;
  status: string;
  createdAt: string;
}

// Upstream error response shape (best-effort — adapt if real API differs)
export interface SweetBookErrorBody {
  code?: string;
  message?: string;
}
