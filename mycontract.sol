// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Creating a contract
contract mycontract {
    // Private state variable
    address private owner;
    uint256 counter = 0;

  
    struct Transaction {
        //I O U
        address debtor;
        address[10] creditor;
        uint256[10] money;
    }

    //Transaction[] public trsRecords;
    mapping(address => Transaction) public transactionRecords;

    // mapping([address, address] => Transaction) newtransactionRecords;

    function add_IOU(
        address creditor,
        uint32 amount,
        address[] memory path,
        uint256 minAmount
    ) external {
 
        if (path.length == 1) {
            // this means, no loop          
            address debtor = path[0];
            if (transactionRecords[debtor].debtor != address(0)) {
                uint32 i = 0;
                for (i; i < transactionRecords[debtor].creditor.length; i++) {
                    if (transactionRecords[debtor].creditor[i] == creditor) {
                        transactionRecords[debtor].money[i] += amount;
                       
                        break;
                    }
                    if (transactionRecords[debtor].creditor[i] == address(0)) {
                        transactionRecords[debtor].creditor[i] = creditor;
                        transactionRecords[debtor].money[i] += amount;
                     
                        break;
                    }
                } /**/
              
            } else {
                address _debtor = path[0];
                address[10] memory tcreditors;
                tcreditors[0] = creditor;

                uint256[10] memory tmoneys;
                tmoneys[0] = amount;

                Transaction memory tr = Transaction(
                    _debtor,
                    tcreditors,
                    tmoneys
                );
                transactionRecords[path[0]] = tr;               
               
            }

            // trsRecords.push(tr);
        } else {
           
            address[10] memory tcreditors;
            tcreditors[0] = path[0];

            uint256[10] memory tmoneys;
            tmoneys[0] = amount - minAmount;
            address tDebtor = path[path.length - 1];
            // create new one to make the path be a loop

            if (transactionRecords[tDebtor].debtor == address(0)) {
                Transaction memory tr = Transaction(
                    tDebtor,
                    tcreditors,
                    tmoneys
                ); // to berify; it may already be there, but 0 in wallet;
                transactionRecords[tDebtor] = tr;
            }
            else {
                    uint32 k=0;
                for (
                    k ;
                    k < transactionRecords[tDebtor].creditor.length - 1;
                    k++
                ) {
                    if (transactionRecords[tDebtor].creditor[k] == path[0] || transactionRecords[tDebtor].creditor[k]==address(0)) {
                      
                        transactionRecords[tDebtor].creditor[k] == path[0];
                        transactionRecords[tDebtor].money[k] += minAmount;                       
                        break;
                    }
                    // if not found, need to add new link
                }


            }

         
            for (uint32 i = 0; i < path.length - 1; i++) {
                address tmpDebtor = path[i];
                address tmpCreditor = path[i + 1];
                for (
                    uint32 k = 0;
                    k < transactionRecords[tmpDebtor].creditor.length - 1;
                    k++
                ) {
                    if (transactionRecords[tmpDebtor].creditor[k] == tmpCreditor) {
                     
                        transactionRecords[tmpDebtor].money[k] -= minAmount;
                       
                        break;
                    }
                }
            } 
        }
    }

    
    //Returns the amount that the debtor owes the creditor.
    function lookup(address debtor, address creditor)
        external
        view
        returns (uint256 tIOU)
    {
        uint256 totalIOU = 0;

        if (transactionRecords[debtor].debtor != address(0)) {
            for (
                uint32 i = 0;
                i < transactionRecords[debtor].creditor.length;
                i++
            ) {
                if (transactionRecords[debtor].creditor[i] == creditor) {
                    totalIOU = transactionRecords[debtor].money[i];
                }
            }
        }

        return totalIOU;
    }

    function getCreditors(address debtor) external view returns (address[10] memory ) {

        address[10] memory temp; 
        if (transactionRecords[debtor].debtor != address(0))
            temp = transactionRecords[debtor].creditor;
     
        return temp;
    }


     function gettotalowed(address user)
        external
        view
        returns (uint256 tIOU)
    {
        uint256 totalIOU = 0;

        if (transactionRecords[user].debtor != address(0)) {
            for (
                uint32 i = 0;
                i < transactionRecords[user].creditor.length;
                i++
            ) {
                
                    totalIOU += transactionRecords[user].money[i];
                
            }
        }

        return totalIOU;
    }

}
