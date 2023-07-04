
//There is a new feature from React's SSR to recognize whether a component is client-side or server-side
'use client';
import {useState, useEffect, forwardRef} from 'react';
import {Text, Select, Group, Avatar, Divider, Modal, Accordion, Notification, Loader, Center, Card} from '@mantine/core';
import axios from 'axios';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

import EmployeeTable from './components/EmployeeTable'
import { error } from 'console';

// Interfaces to be used in components

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  image: string;
  label: string;
  value: string;
  token: string;
}

interface ProviderCompany {
  id: string;
  legal_name: string | null;
  ein: string | null;
  entity: {
    type: string;
    subtype: string;
  } | null;
  primary_email: string | null;
  primary_phone_number: string | null;
  accounts: any[] | null;
  departments: any[] | null;
  locations: any[] | null;
}

interface IndividualDetail {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  emails: any[] | null;
  phone_numbers: any[] | null;
  residence: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    } | null;
  gender: string | null;
  dob: string | null;
  ethnicity: string | null;
  ssn: string | null;
}

interface Error { 
  id: string;
  message: string;
}

interface DepartmentType {
  name: string;
  parent: null | { name: string };
  children?: DepartmentType[];
}

const departments: DepartmentType[] = [
  { "name": "West Coast", "parent": null },
  { "name": "East Coast", "parent": null },
  { "name": "Product", "parent": { "name": "West Coast" } },
  { "name": "Support", "parent": { "name": "East Coast" } },
  { "name": "GTM", "parent": { "name": "West Coast" } },
];

const Department: React.FC<{ department: DepartmentType, children?: React.ReactNode }> = ({ department, children }) => (
  <li>
    <Text style={{color:'black'}}>
      {department.name}
    </Text>
    <Text style={{color:'black', paddingLeft: 30}}>
        {children && <ul>{children}</ul>}
    </Text>
  </li>
);

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ image, value, label, ...others }: ItemProps, ref) => (
    <div key={value} ref={ref} {...others}>
      <Group key={value} noWrap>
        <div>
          <Text size="sm">{label}</Text>
        </div>
      </Group>
    </div>
  )
);

// Manually designating the display name instead of creating a functional component.
SelectItem.displayName = "SelectItem"

function Home() {

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [companyDetailsLoading, setCompanyDetailsLoading] = useState(false)
  const [directoryLoading, setDirectoryLoading] = useState(false)
  const [sandboxProviders, setSandboxProviders] = useState<any[]>([
    {
      value:'gusto',
      label: 'Gusto'
    },
    {
      value:'bamboohr',
      label: 'BambooHR'
    },
    {
      value:'justworks',
      label: 'Justworks'
    },
    {
      value:'paychex_flex',
      label: 'Paychex Flex'
    },
    {
      value: 'workday',
      label: 'Workday'
    }
  ])

  const [providerCompany, setProviderCompany] = useState<ProviderCompany | null >(null)
  const [providerDirectory, setProviderDirectory] = useState<any | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<IndividualDetail | null>(null)
  const [errors, setErrors] = useState<Error[] | null>(null)
  const [showModal, setShowModal] = useState(false)

  const addError = async (newError: Error) => {
    let updatedErrors : Error[] | null = errors;

    if(!updatedErrors) {
      updatedErrors = [newError];
    } else {
      updatedErrors.push(newError);
    }

    let result = await setErrors(updatedErrors)

    return result;
  }

  const removeError = async (errorId: string) => {
    let updatedErrors : Error[] | null = errors;

    if(!updatedErrors) {
      return null
    } else {
      updatedErrors = updatedErrors.filter(function(error: Error){
        if(error.id === errorId){
          return false
        } else {
          return true
        }
      })

      setErrors(updatedErrors);

    }

    return true 
  }

  const fetchProviderToken = async (providerId: string) => {
    // Check if provider token has already been fetched
    if(!sandboxProviders.filter((provider) => provider.value === providerId)[0].token) {
      // Provider token does not exist.  So, fetch it.
      try {
        const res = await axios({
          method: 'POST',
          url: '/api/sandbox/create',
          data: {
            provider: providerId,
            products: [
              "company", "directory", "individual", "employment"
            ]
          }
        });
        
        if(res.data && res.data.access_token) {
            var updatedSandboxProviders = sandboxProviders.map((provider) => {
                if(provider.value === providerId) {
                  provider.token = res.data.access_token
                }
                return provider;
              }
            );
            setSandboxProviders(updatedSandboxProviders);
            return res.data.access_token; 
          }
        } catch (err) {
          console.log(err);
        }
    } else {
      // Provider token already exists.  So, simply return the existing token.
      return sandboxProviders.filter((provider) => provider.value === providerId)[0].token
    }
  }

  const fetchProviderCompany = async (providerToken: string) => {
    
    setCompanyDetailsLoading(true)

    await axios({
      method: 'GET',
      url: '/api/employer/company',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    }).then((res) => {
      if(res.data && res.data.id) {
       const company = res.data
       let providerCompany : ProviderCompany = {
          id: company.id,
          legal_name: company.legal_name ? company.legal_name : null,
          ein: company.ein ? company.ein : null,
          entity: company.entity ? {
            type: company.entity.type ? company.entity.type : null,
            subtype: company.entity.subtype ? company.entity.subtype : null
          } : null, 
          primary_email: company.primary_email ? company.primary_email : null,
          primary_phone_number: company.primary_phone_number ? company.primary_phone_number : null,
          accounts: company.accounts ? company.accounts : null,
          departments: company.departments ? company.departments : null,
          locations: company.locations ? company.locations : null
        }
        setProviderCompany(providerCompany)
        setCompanyDetailsLoading(false)
        return providerCompany
      }
    }).catch((err) => {
      setCompanyDetailsLoading(false)
      if(err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message == "Not Implemented") {
          addError({
            id: uuidv4(),
            message: "This provider does not support the Company API"
          })
          setProviderCompany(null)
        }
      } else {
        addError({
          id: uuidv4(),
          message: "Error fetching provider company"
        })
      }
      return null
    })
  }

  const fetchProviderDirectory = async (providerToken: string) => {

    setDirectoryLoading(true);

    await axios({
      method: 'GET',
      url: '/api/employer/directory',
      headers: {
        'Authorization': `Bearer ${providerToken}`
      }
    }).then((res) => {
      if(res.data){
        let employeeArray = res.data.individuals ? res.data.individuals : []

        let tableData = employeeArray.map((employee: any) => {
          return {
            id: employee.id,
            key: employee.id,
            value: employee.id,
            first_name: employee.first_name ? employee.first_name : null,
            last_name: employee.last_name ? employee.last_name : null,
            middle_name: employee.middle_name ? employee.middle_name : null,
            department: employee.department.name ? employee.department.name : null,
            manager: employee.manager && employeeArray.filter((element : any)=>{
              return element?.id == employee.manager?.id
            }) ? (employeeArray.filter((element : any)=>{
              return element?.id == employee.manager?.id
            })[0].first_name +" " + employeeArray.filter((element : any)=>{
              return element?.id == employee.manager?.id
            })[0].last_name ) : null,
            is_active: employee.is_active ? employee.is_active : null,
          }
        })
        console.log(tableData)
        setProviderDirectory(tableData);
        setDirectoryLoading(false);
      }
    }).catch((err) => {
      setDirectoryLoading(false);
      addError({
        id: uuidv4(),
        message: "Error fetching provider directory."
      })
    })
  }

  const fetchEmployeeDetails = async (providerToken: string, employeeId: string) => {
      await axios({
        method: 'POST',
        url: '/api/employer/individual',
        headers: {
          'Authorization': `Bearer ${providerToken}`
        },
        data: {
          requests: [
            {
              individual_id: employeeId
            }
          ]
        }
      }).then((res) => {  
        let responses = res.data.responses
        console.log(res)
        if(res.data.responses && responses.length > 0) {
          let employeeData = responses[0].body
          let employee: IndividualDetail = {
            id: responses[0].individual_id,
            first_name: employeeData.first_name ? employeeData.first_name : null,
            last_name: employeeData.last_name ? employeeData.last_name : null,
            middle_name: employeeData.middle_name ? employeeData.middle_name : null,
            preferred_name: employeeData.preferred_name ? employeeData.preferred_name : null,
            emails: employeeData.emails ? employeeData.emails : null,
            phone_numbers: employeeData.phone_numbers ? employeeData.phone_numbers : null,
            residence: employeeData.residence ? {
              line1: employeeData.residence.line1 ? employeeData.residence.line1 : null,
              line2: employeeData.residence.line2 ? employeeData.residence.line2 : null,
              city: employeeData.residence.city ? employeeData.residence.city : null,
              state: employeeData.residence.state ? employeeData.residence.state : null,
              postal_code: employeeData.residence.postal_code ? employeeData.residence.postal_code : null,
              country: employeeData.residence.country ? employeeData.residence.country : null,
            } : null,
            dob: employeeData.dob ? employeeData.dob : null,
            gender: employeeData.gender ? employeeData.gender : null,
            ethnicity: employeeData.ethnicity ? employeeData.ethnicity : null,
            ssn: employeeData.ssn ? employeeData.ssn : null,
          }

            setSelectedEmployee(employee)
            return employee
          }

      }).catch((err) => {
        addError({
          id: uuidv4(),
          message:"Error fetching employee details."
        });
      })


  }

  const updateSelectedProvider = async (providerId: string) => { 
    setSelectedProvider(providerId)
    const token = await fetchProviderToken(providerId)
    if(token !== null) {
      const providerCompany = await fetchProviderCompany(token)
      const providerDirectory = await fetchProviderDirectory(token)
    } else {
       addError({
        id: uuidv4(),
        message: "Error fetching provider token"
       })
    }
  }

  const selectEmployee = async (employeeId: string | undefined) => {
    if(selectedProvider && employeeId) {
      let providerToken = await fetchProviderToken(selectedProvider)
      const individual = await fetchEmployeeDetails(providerToken, employeeId)

      if(individual !== null) {
        setShowModal(true)
        console.log("Individual")
        console.log(individual)
      }

    } else {
      addError({
        id: uuidv4(),
        message: "Error fetching employee details!"
      })
    }

  }


  const renderParentDepartments = () => {
    //If this tree was to require dynamic data, we could store it in state.

    if(providerCompany){
      let departments = providerCompany.departments;
      let departmentTree: DepartmentType[] = [];
      let childrenMap: Record<string, DepartmentType[]> = {};

      departments?.forEach((department) => {
        if(department.parent == null){
          departmentTree.push({...department, children:[]});
        } else {
          if(!childrenMap[department.parent.name]){
            childrenMap[department.parent.name] = [];
          }
          childrenMap[department.parent.name].push(department);
        }
      })

      const mapChildren = (department: DepartmentType): DepartmentType => {
        if (childrenMap[department.name]) {
          department.children = childrenMap[department.name].map(mapChildren);
        }
        return department;
      };

      departmentTree = departmentTree.map(mapChildren);

      return renderDepartmentsTree(departmentTree);

    } else {
      return null
    }
  
  }

  const renderDepartmentsTree = (nodes: DepartmentType[]) => nodes.map((node) => (
    <Department key={node.name} department={node}>
      {node.children && renderDepartmentsTree(node.children)}
    </Department>
  ));

  return (
    <div style={{padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100vw'}}>
      <>
        {
          errors ? (
            errors.map((error)=> {
              return (
                <div key={error.id}>
                  <Notification key={error.id} color={'red'} onClose={()=>{
                    removeError(error.id)
                  }} title="Error">
                      {error.message}
                  </Notification>
                  <div style={{height: 20}}/>
                </div>
              )
            })
          ) : null
        }
      </>
      
      {
        showModal ? (
          <Modal size={'lg'} title={
            <Text style={{fontWeight: 'bold', fontSize: '20px'}}>
              Individual Employee Details
            </Text>
          } opened={showModal} onClose={() => {
            setShowModal(false)
          }}>
            <div>
              <div style={{paddingTop: 20, paddingBottom: 20}}>
                <Text style={{fontWeight: 'bold'}}>
                  Identification
                </Text>
                <div >
                  <Text>
                    First Name: {selectedEmployee?.first_name ? selectedEmployee?.first_name : 'Not available from selected provider'}
                  </Text>
                  <Text>
                    Middle Name: {selectedEmployee?.middle_name ? selectedEmployee?.middle_name : 'Not available from selected provider'}
                  </Text>
                  <Text>
                    Last Name: {selectedEmployee?.last_name ? selectedEmployee?.last_name : 'Not available from selected provider'}
                  </Text>
                  {
                    selectedEmployee?.preferred_name ? (
                      <Text>
                        Preferred Name: {selectedEmployee.preferred_name}
                      </Text>
                    ) : null
                  }
                  <Text>
                    Date of Birth: {selectedEmployee?.dob ? selectedEmployee?.dob : 'Not available from selected provider'}
                  </Text>
                  <Text>
                    Gender: {selectedEmployee?.gender ? selectedEmployee?.gender : 'Not available from selected provider'}
                  </Text>
                  <Text>
                    Ethnicity: {selectedEmployee?.ethnicity ? selectedEmployee?.ethnicity : 'Not available from selected provider'}
                  </Text>
                  <Text>
                    SSN: {selectedEmployee?.ssn ? selectedEmployee?.ssn : 'Not available from selected provider'}
                  </Text>
                </div>
              </div>
              <div style={{paddingTop: 20, paddingBottom: 20}}>
                <Text style={{fontWeight: 'bold'}}>
                  Contact Information
                </Text>
                {
                  selectedEmployee?.emails && selectedEmployee?.emails.length > 0 ? (
                    selectedEmployee?.emails.map((email) => {
                      return (
                        <div key={email.data} style={{paddingTop: 10, paddingBottom:10}}>
                          <Card style={{border: '1px solid grey', padding: 30}}>
                            <Card.Section>
                              <Text>
                                Email: {email.data}
                              </Text>
                              <Text>
                                Type: {email.type}
                              </Text>
                            </Card.Section>
                          </Card>
                        </div>
                      )
                    })
                  ) : (
                    <Text>
                      No Emails available
                    </Text>
                  )
                }
                {
                  selectedEmployee?.phone_numbers && selectedEmployee?.phone_numbers.length > 0 ? (
                    selectedEmployee?.phone_numbers.map((number) => {
                      return (
                        <div key={number.data} style={{paddingTop: 10, paddingBottom:10}}>
                          <Card style={{border: '1px solid grey', padding: 30}}>
                            <Card.Section>
                              <Text>
                                Phone Number: {number.data}
                              </Text>
                              <Text>
                                Type: {number.type}
                              </Text>
                            </Card.Section>
                          </Card>
                        </div>
                      )
                    })
                  ) : (
                    <Text>
                      No Emails available
                    </Text>
                  )
                }
              </div>
              <div style={{paddingTop: 20, paddingBottom: 20}}>
                <Text style={{fontWeight: 'bold'}}>
                  Address
                </Text>
            
                {
                   selectedEmployee?.residence ? (
                      <div>
                        <Card style={{border: '1px solid grey', padding: 30}}>
                          <Card.Section>
                              {
                                selectedEmployee.residence?.line1 && selectedEmployee.residence.line2 ? (
                                  <Text>
                                  Street: {selectedEmployee.residence.line1} {selectedEmployee.residence.line2} 
                                  </Text>
                                ) : selectedEmployee.residence.line1 && !selectedEmployee.residence.line2 ? (
                                  <Text>
                                    Street: {selectedEmployee.residence.line1}
                                  </Text>
                                ) : (
                                  <Text>
                                    Street: Not available from {selectedProvider}.
                                  </Text>
                                )
                              }

                              {
                                selectedEmployee.residence.city ? (
                                  <Text>
                                    City: {selectedEmployee.residence.city}
                                  </Text>
                                ) : (
                                  <Text>
                                    City: Not available from {selectedProvider}.
                                  </Text>
                                )
                              }

                              {
                                selectedEmployee.residence.state ? (
                                  <Text>
                                    State: {selectedEmployee.residence.state}
                                  </Text>
                                ) : null
                              }
                                {
                                selectedEmployee.residence.country ? (
                                  <Text>
                                    Country: {selectedEmployee.residence.country}
                                  </Text>
                                ) : (
                                  <Text>
                                    Country: Not available from {selectedProvider}.
                                  </Text>
                                )
                              }
                              {
                                selectedEmployee.residence.postal_code ? (
                                  <Text>
                                    Postal Code: {selectedEmployee.residence.postal_code}
                                  </Text>
                                ) : (
                                  <Text>
                                    Postal Code: Not available from {selectedProvider}.
                                  </Text>
                                )
                              }
                          </Card.Section>
                        </Card>
                      </div>
                   ) : (
                      <Text>
                        No residence available from selected provider.
                      </Text>
                   ) 
                }
              </div>
            </div>
          </Modal>
        ) : null
      }
      <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '50%'}}>
        <Select
          value={selectedProvider}
          label={
            <Text style={{color: 'white'}}>
              Select provider
            </Text>
          }
          data={sandboxProviders}
          placeholder='Select provider'
          itemComponent={SelectItem}
          onChange={updateSelectedProvider}
          />
      </div>
      <div style={{paddingTop: 20, width: '50%'}}>
        {
          selectedProvider && providerCompany && !companyDetailsLoading ? (
              <div>
                <Text sx={{fontSize: '20px', fontWeight: 'bold'}}>
                  Company Details
                </Text>
                <div style={{height: 20}}/>
                <Accordion defaultValue="general" variant="separated">
                  <Accordion.Item value="general">
                    <Accordion.Control>
                        <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                          General
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <div style={{padding: 10}}>
                        <Text style={{color:"black"}}>
                          Legal Name: {providerCompany?.legal_name ? providerCompany?.legal_name : "Not available for this provider."}
                        </Text>
                        <Text style={{color:"black"}}>
                          EIN: {providerCompany?.ein ? providerCompany?.ein : "Not available for this provider."}
                        </Text>
                        <Text style={{color:"black"}}>
                          Primary Email: {providerCompany?.primary_email ? providerCompany?.primary_email : "Not available for this provider."}
                        </Text>
                        <Text style={{color:"black"}}>
                          Phone Number: {providerCompany?.primary_phone_number ? providerCompany?.primary_phone_number : "Not available for this provider."}
                        </Text>
                      </div>
                     
                    </Accordion.Panel>
                  </Accordion.Item>             
                  {
                    providerCompany?.entity ? (
                      <Accordion.Item value="entity">
                        <Accordion.Control>
                            <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                              Entity Type
                            </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <div style={{padding: 10}}>
                              <Text style={{color:"black"}}>
                                Type: {providerCompany?.entity?.type ? providerCompany?.entity?.type : "Not available for this provider."}
                              </Text>
                              <Text style={{color:"black"}}>
                                Subtype: {providerCompany?.entity?.subtype ? providerCompany?.entity?.subtype : "Not available for this provider."}
                              </Text>
                          </div>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ) : null
                  }
                  {
                    providerCompany?.departments && providerCompany.departments.length > 0 ? (
                      <Accordion.Item value="departments">
                      <Accordion.Control>
                          <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                            Departments
                          </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <div style={{paddingLeft: 10, paddingBottom: 10}}>
                          {renderParentDepartments()}
                        </div>
                      </Accordion.Panel>
                    </Accordion.Item>
                    ): null
                  }

                  {
                    providerCompany?.locations && providerCompany.locations.length > 0 ? (
                      <Accordion.Item value="locations">
                      <Accordion.Control>
                          <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                            Locations
                          </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <div style={{padding: 10}}>
                          {providerCompany.locations.map((location) => {
                            return (
                              <>
                                <Card style={{border: '1px solid grey', padding: 30}}>
                                  <Card.Section>

                                      {
                                        location.line1 && location.line2 ? (
                                          <Text>
                                          Street: {location.line1} {location.line2} 
                                          </Text>
                                        ) : location.line1 && !location.line2 ? (
                                          <Text>
                                            Street: {location.line1}
                                          </Text>
                                        ) : (
                                          <Text>
                                            Street: Not available from {selectedProvider}.
                                          </Text>
                                        )
                                      }

                                      {
                                        location.city ? (
                                          <Text>
                                            City: {location.city}
                                          </Text>
                                        ) : (
                                          <Text>
                                            City: Not available from {selectedProvider}.
                                          </Text>
                                        )
                                      }

                                      {
                                        location.state ? (
                                          <Text>
                                            State: {location.state}
                                          </Text>
                                        ) : null
                                      }
                                       {
                                        location.country ? (
                                          <Text>
                                            Country: {location.country}
                                          </Text>
                                        ) : (
                                          <Text>
                                            Country: Not available from {selectedProvider}.
                                          </Text>
                                        )
                                      }
                                      {
                                        location.postal_code ? (
                                          <Text>
                                            Postal Code: {location.postal_code}
                                          </Text>
                                        ) : (
                                          <Text>
                                            Postal Code: Not available from {selectedProvider}.
                                          </Text>
                                        )
                                      }

                                  </Card.Section>
                                </Card>
                                <div style={{height: 10}}/>
                              </>
                              
                            )
                          })}
                        </div>
                       
                      </Accordion.Panel>
                    </Accordion.Item>
                    ) : null
                  }

                {
                    providerCompany?.accounts && providerCompany.accounts.length > 0 ? (
                      <Accordion.Item value="accounts">
                      <Accordion.Control>
                          <Text style={{fontSize: '20px', fontWeight: 'medium'}}>
                            Accounts
                          </Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <div style={{padding: 10}}>
                          {providerCompany.accounts.map((account) => {
                            return (
                              <>
                                <Card style={{border: '1px solid grey', padding: 30}}>
                                  <Card.Section>
                                    {
                                      account.institution_name ? (
                                        <Text>
                                          Institution: {account.institution_name}
                                        </Text> 
                                      ) : (
                                          <Text>
                                            Institution: Not available from {selectedProvider}.
                                          </Text>
                                        )
                                    }
                                    {
                                      account.account_name ? (
                                        <Text>
                                          Account Name: {account.account_name}
                                        </Text> 
                                      ) : (
                                        <Text>
                                          Account Name: Not available from {selectedProvider}.
                                        </Text>
                                      )
                                    }
                                     {
                                      account.account_name ? (
                                        <Text>
                                          Account Type: {account.account_type}
                                        </Text> 
                                      ) : (
                                        <Text>
                                          Account Type: Not available from {selectedProvider}.
                                        </Text>
                                      )
                                    }
                                    {
                                      account.account_number ? (
                                        <Text>
                                          Account Number: {account.account_number}
                                        </Text> 
                                      ) : (
                                        <Text>
                                          Account Number: Not available from {selectedProvider}.
                                        </Text>
                                      )
                                    }
                                    {
                                      account.routing_number ? (
                                        <Text>
                                          Routing Number: {account.routing_number}
                                        </Text> 
                                      ) : (
                                        <Text>
                                          Routing Number: Not available from {selectedProvider}.
                                        </Text>
                                      )
                                    }
                                  </Card.Section>
                                </Card>
                                <div style={{height: 10}}/>
                              </>
                              
                            )
                          })}
                        </div>
                       
                      </Accordion.Panel>
                    </Accordion.Item>
                    ) : null
                  }

                </Accordion>

              </div>
          ) : companyDetailsLoading ? (
              <Center>
                <Loader/>
              </Center>
          ) : null
        }
      </div>
      <div style={{paddingTop: 20, width: '100%'}}>
          {
            selectedProvider && providerDirectory && !directoryLoading ? (
                <div>
                  <Text sx={{fontSize: '20px', fontWeight: 'bold'}}>
                    Employee Directory
                  </Text>
                  <EmployeeTable data={providerDirectory} selectEmployee={selectEmployee}/>
                </div>
            ) : directoryLoading ? (
                <Center>
                  <Loader/>
                </Center>
            ) : null
          }

      </div>         
    </div>
  )
}

export default Home