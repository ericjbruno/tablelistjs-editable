<%@page contentType="text/html" pageEncoding="UTF-8"%>
<%@page language="java" import="java.lang.*,java.util.*,java.sql.*"%>

<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" href="tablelist.css" type="text/css" />

        <script src="tablelist.js" type="text/javascript" ></script>
        <title>JSP Page</title>
    </head>
    <body>

<%!
    class Customer {
        int id;
        String name;
        String address;
        String state;
        String city;
        String phone;
        String email;
    };
    
    Vector<Customer> customers = null;
    Vector<Customer> edits = null;
    
    String driver = "org.apache.derby.jdbc.EmbeddedDriver";
    String url = "jdbc:derby://localhost:1527/sample";
    String usr = "app";
    String pwd = "app";
    Connection con = null;
    final Object lock = new Object(); 
%>

<%
    String action = request.getParameter("action");
    if ( action == null || 
         action.equalsIgnoreCase("null") ||
         action.equalsIgnoreCase("updaterow") ) {
                
        try {
            if ( con == null ) {
                System.setProperty("derby.database.forceDatabaseLock", "true");
                Class.forName( driver ).newInstance();
                con = DriverManager.getConnection( url, usr, pwd );
            }
        }
        catch ( Exception e ) {
            // Database connect failed because it probably doesn't exist
            e.printStackTrace();
        }

        if ( con != null ) {
            System.out.println("Database connected");
            if ( customers == null ) {
                customers = new Vector<Customer>();
                
                // Get the database rows from the CUSTOMER table and add each
                // one as a row in the TableListJS HTML5 list
                //
                String req = "SELECT * FROM APP.CUSTOMER ORDER BY NAME"; // sorted
                PreparedStatement ps = con.prepareStatement(req);
                ResultSet rs = ps.executeQuery();
                while ( rs.next() ) {
                    Customer customer = new Customer();
                    customer.id = rs.getInt("CUSTOMER_ID");
                    customer.name = rs.getString("NAME");
                    customer.address = rs.getString("ADDRESSLINE1");
                    customer.city = rs.getString("CITY");
                    customer.state = rs.getString("STATE");
                    customer.phone = rs.getString("PHONE");
                    customer.email = rs.getString("EMAIL");
                    customers.add(customer);
                }
                rs.close();
                ps.close();
            }
        }
        else {
            System.out.println("Database NOT connected");
        }
%>
<%
        if ( action != null && action.equalsIgnoreCase("updaterow") ) { 
            // Grab the updated customer data and store it for later
            Customer custEdit = new Customer();
            custEdit.name = request.getParameter("name");
            custEdit.address = request.getParameter("address");
            custEdit.city = request.getParameter("city");
            custEdit.state = request.getParameter("state");
            custEdit.phone = request.getParameter("phone");
            custEdit.email = request.getParameter("email");

            // Store the row so its edits can be applied to the database later
            if ( edits == null ) {
                edits = new Vector<>();
            }
            edits.add(custEdit);
            
            // Reselect the previously selected row
            String row = request.getParameter("row"); 

            // Update this customer entry in the Vector
            //
            int index = new Integer(row).intValue() - 1;
            Customer cust = customers.elementAt(index);
            customers.remove(index);
            customers.add(index, custEdit);

    %>
            <script type="text/javascript">
                //var tbl = document.getElementById('entries');
    //                selectRow(<%= row %>);
            </script>
    <%
        }
    %>
    <div>Searchable TableListJS By Eric Bruno</div>
    <p></p>
    <form name="entry" id="entry" method=POST action=index.jsp>        
        <!-- Although this select list is hidden, we still need to populate
             it with the same entries as the visible table so that selections
             in the table can be replicated here as well. This is to allow
             form selections to be submitted
        -->
        <select id="rowEntries" name="rowEntries" size=10 tabindex="0" style="width: 200px" hidden="true">            
<%      
        if ( customers != null ) {
            for ( int i = 0; i < customers.size(); i++ ) {
                Customer customer = customers.elementAt(i);
%>
                <option value="<%= i %>"><%= customer.name %></option>
<%      
            }
        }
%>

        </select>        
        Search 
        <input type="text" id='filterTxt' name="filterTxt"
               size="21" tabindex="1" style="width: 418px"><br>
        <table class="TableListJS" id="entries">
            <thead>
                <tr>
                   <td width='200px'>Customer</td>
                   <td width='200px'>Address</td>
                   <td width='100px'>City</td>
                   <td width='30px'>State</td>
                   <td width='100px'>Phone</td>
                   <td width='100px'>Email</td>
                </tr>
            </thead>
            <tbody style='height:150px'>
<%
        if ( customers != null ) {
            for ( int i = 0; i < customers.size(); i++ ) {
                Customer customer = customers.elementAt(i);
%>                
                <script type="text/javascript">
                    textArr = [ "<%= customer.name %>",
                                "<%= customer.address %>",
                                "<%= customer.city %>",
                                "<%= customer.state %>",
                                "<%= customer.phone %>",
                                "<%= customer.email %>"];
                    addRow(textArr);
                </script>
<%
            }
        }
%>
<script type="text/javascript">
        var tbl = document.getElementById('entries');
        
        if ( tbl !== null ) {
            tbl.addEventListener('onroweditcomplete', function (e) { 
                //alert("Row Edit Complete: " + e.detail );
                if ( e.detail.data.length > 5 ) {
                    // Construct a URL with the provided data. The
                    // result will be the storage of the updated customer
                    // data to be updated in the database when submitted
                    //
                    var url = "index.jsp?action=updaterow&name=" + e.detail.data[0] +
                              "&address=" + e.detail.data[1] +
                              "&city=" + e.detail.data[2] +
                              "&state=" + e.detail.data[3] +
                              "&phone=" + e.detail.data[4] +
                              "&email=" + e.detail.data[5] +
                              "&row=" + e.detail.data[6] ;
                      
                    // redirect to this url
                    //<meta http-equiv="refresh" content="<%= url %>"/>
                    window.location.href = url;
                }
            }, false);
        }
</script>        


            </tbody>
        </table>
        <input type=submit name=action value="Next ->" tabindex="7">
    </form>
<%
    }
    else if ( action.equalsIgnoreCase("Next ->") ) {
        //
        // Check for edits and update the database
        //

        // First, get the selected row and just assume it was edited
        //
        String index = request.getParameter("rowEntries");
        if ( index != null ) {
            Customer customer = null;
            if ( customers != null ) {
                customer = customers.elementAt(Integer.valueOf(index));
            }
            
            // Add the selected entry and add it to the list of edited entries
            //
            if ( edits == null ) {
                edits = new Vector<>();
            }
            edits.add(customer);
        }
            
        // Go through all of the edited entries and update the database
        if ( con != null ) {
            String req = "UPDATE APP.CUSTOMER SET" +
                         " NAME=?, " +
                         " ADDRESSLINE1=?, " +
                         " CITY=?, " +
                         " STATE=?, " +
                         " PHONE=?, " +
                         " EMAIL=?" +
                         " WHERE CUSTOMER_ID=?";

            Iterator<Customer> iter = edits.iterator();
            while ( iter.hasNext() ) {
                Customer custEdit = iter.next();
                out.println("Updating database for customer name: " + custEdit.name);
                PreparedStatement ps = con.prepareStatement(req);
                ps.setString(1, custEdit.name);
                ps.setString(2, custEdit.address);
                ps.setString(3, custEdit.city);
                ps.setString(4, custEdit.state);
                ps.setString(5, custEdit.phone);
                ps.setString(6, custEdit.email);
                ps.setInt(7, custEdit.id);
                ps.execute();
                ps.close();
            }
        }
    }
%>
    </body>
</html>
