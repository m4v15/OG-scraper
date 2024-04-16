const ogs = require('open-graph-scraper');
const options = { url: 'https://www.gofundme.com/f/help-tasneem-hazem-families-to-escape-from-death?utm_campaign=p_cp+share-sheet&utm_medium=copy_link_all&utm_source=customer&utm_term=CP_SSS_control' };
ogs(options)
  .then((data) => {
    const { error, html, result, response } = data;
    console.log('error:', error);  // This returns true or false. True if there was an error. The error itself is inside the result object.
    console.log('html:', html); // This contains the HTML of page
    console.log('result:', result); // This contains all of the Open Graph results
    console.log('response:', response); // This contains response from the Fetch API
  })