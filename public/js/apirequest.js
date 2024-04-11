let API_URL = "localhost:27017";

/* Uncomment this line to point requests at your local server. */
API_URL = "/api";

/* Do not modify or remove this line. It allows us to redirect the API for grading. */
if (window.API_URL) API_URL = window.API_URL;

/* Subclass of Error for representing HTTP errors returned from the API.
   Exposes a status (the HTTP response status code) and message (a user-facing message).

   Example usage:
      throw new HTTPError(500, "This feature is not implemented"); */
export class HTTPError extends Error {
  /* status is the HTTP status, message is a user-facing error message. */
  constructor(status, message) {
    /* Call the Error constructor with the given message. */
    super(message);
    this.status = status;
  }
}

/* Make an API request.
   - method is the HTTP method.
   - path is the URI. It must begin with a /. Does not include API_URL.
   - body (optional) is the request body as a JS object that can be converted to JSON.
// http://localhost:1930/users/mchang
   The API is assumed to return JSON. If the response status is 200, the response body (as a JS object) is returned.
   If the response has any other status, an HTTPError is thrown, with its status set to the response status and its
   message set to the value of the `error` property of the response, which we assume is a user-facing error message. */
//    Đây là hàm chính để thực hiện yêu cầu API.
// Nó nhận ba tham số: method (phương thức HTTP), path (đường dẫn URI), và body (nội dung yêu cầu, có thể là null).
// Hàm này sử dụng fetch để gửi(phương thức ) yêu cầu tới máy chủ API với các thiết lập phù hợp, bao gồm phương thức, tiêu đề và nội dung.
// fetch Read contents from a URL (which could be relative)
// Returns a Promise with the response
// await operator
// await <promise>;
// Wait for the promise to settle  If fulfilled, return its result
// If rejected, throw exception
// Only valid inside an async function

const apiRequest = async (method, path, body = null) => {
  try {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: {


        "Content-Type": "application/json"
        // là một header HTTP được sử dụng để chỉ định loại nội dung (content type) của dữ liệu gửi đi.
        // Trong trường hợp này, application/json cho biết rằng dữ liệu được gửi đi hoặc nhận được từ máy chủ là dạng JSON
      },
      // điều này là một cách kiểm tra xem biến body có giá trị hay không. Dưới đây là cách nó hoạt động:
      body: body ? JSON.stringify(body) : null
    });
    console.log(API_URL + path);

    if (!response.ok) {
      // Điều kiện này kiểm tra xem phản hồi từ máy chủ có thành công không.
      // nếu mã trạng thái của phản hồi nằm trong khoảng 200-299, tức là phản hồi được coi là thành công.
      //  Nếu không, nó sẽ tiếp tục vào phần mã bên trong để xử lý lỗi.
      const errorData = await response.json();
      throw new HTTPError(response.status, errorData.error);
    }

    return await response.json();
  } catch (error) {
    console.error("Error making API request:", error);
    throw error;
  }
};

export default apiRequest;
